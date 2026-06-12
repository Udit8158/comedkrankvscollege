# COMEDK predictor v2 — per-college info pages

## Context

The predictor currently produces a flat list of college-branch matches. The user wants each college row to lead to a dedicated info page that keeps the same aesthetic (Fraunces serif + Instrument Sans + JetBrains Mono on deep ink) and adds four information surfaces per college:

1. **Identity** — name, locality, established year, type
2. **Placement** — CSE avg LPA, overall avg LPA, year (minimal scope for v2)
3. **Cut-offs** — this college's branches with their rank cutoffs, reusing the fit-bar treatment when the user arrives carrying a rank
4. **Student podcast** — single YouTube embed (user already has interviews for 10-15 top COMEDK colleges)

Hard constraint the user named: **data must live in one place** so the project stays maintainable as the metadata grows. 150 colleges total; only ~15 will have podcast + placement filled at launch — the schema must degrade gracefully on the long tail.

Decisions from clarifying questions:

- URLs are **code-based**: `/college/E095`
- Rank carries through: predictor links to `/college/E095?rank=12000`, page filters/highlights what the user qualifies for
- Placement schema is **minimal**: CSE avg LPA, overall avg LPA, year

## Approach

### 1. One source of truth for college metadata

New file `web/src/data/colleges.ts` — typed module exporting one array. All college-level facts live here; the cut-off dataset (`web/src/data.json`) shrinks to records only and stops duplicating college names.

```ts
export type CollegeMeta = {
  code: string; // "E095" — primary key, matches cut-off records
  name: string; // "R V College of Engineering"
  locality?: string; // "Mysore Road"
  city?: string; // "Bengaluru"
  established?: number; // 1963
  type?: "private" | "autonomous" | "deemed" | "government" | "university";
  website?: string;
  about?: string; // 1-2 sentences shown under the hero
  placement?: {
    cseAvgLpa?: number;
    overallAvgLpa?: number;
    year?: number;
  };
  podcast?: {
    youtubeId: string;
    title?: string;
  };
};

export const COLLEGES: CollegeMeta[] = [
  /* 150 entries */
];
```

A one-shot migration script `web/scripts/build-colleges.mjs` reads the current college names out of `data.json` and emits the starter `colleges.ts` so we don't lose what's already there. Top 15 colleges then get placement + podcast hand-filled.

Small helper `web/src/lib/colleges.ts`:

```ts
export function getCollege(code: string): CollegeMeta | undefined { ... }
```

`predict.ts` is updated to source college names via `getCollege(code)` instead of from `data.json` — return shape unchanged.

### 2. Routing + per-college page

- `web/src/app/college/[code]/page.tsx` — static route per college. `generateStaticParams` enumerates the COLLEGES array so all 150 routes pre-render at build time.
- `generateMetadata` so each tab title and OG card carries the college name.
- Reads optional `?rank=` from `searchParams`. With it → "rank context" mode: cut-off table renders fit-bar + tier just like the predictor row. Without it → plain rank column.

### 3. Components (new folder `web/src/components/college/`)

- **`CollegeHero.tsx`** — display-serif name; mono eyebrow `code · est. YYYY · type`; the one-line `about` underneath. Same vocabulary as `From rank / to seat.`, smaller.
- **`PlacementStrip.tsx`** — two mono cells, hairline-ruled: `CSE AVG · 14.5 LPA · 2024` style. Missing data renders a quiet `placement data — not yet published` line, not a loud empty card.
- **`PodcastEmbed.tsx`** — lazy iframe (or `lite-youtube` if we want zero JS until interaction). When the college has no `podcast`, the component returns null — section is absent, not a placeholder.
- **`CollegeCutoffTable.tsx`** — reuses the `ResultRow` row layout from the predictor, fed only this college's records. With `?rank`: fit-bar + tier columns. Without: just the rank.

### 4. Linking from the predictor

In `web/src/components/ResultRow.tsx`, wrap the college code+name in `<Link href={`/college/${collegeCode}?rank=${rank}`}>`. The current user rank comes from the parent `Predictor.tsx` — pass it down as a prop (one extra prop, no context needed).

The existing brass underline-wipe used on the footer signature (`.signature-name` in `globals.css`) gets extracted into a reusable `.linkmark` utility so the predictor's college rows and the footer use the same hover treatment — cohesion via a single class.

### 5. Filling the top 15

New `docs/data-template.md` lists the 15 podcast-covered colleges and the exact fields to fill. User fills it once. A small script (`web/scripts/seed-from-template.mjs`) reads the markdown table and patches `colleges.ts`. Stretch for later: CSV/Google-Sheets ingestion — defer.

## Critical files

| File                                                | Change                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `web/src/data/colleges.ts`                          | **new** — single source of college metadata                                                      |
| `web/src/lib/colleges.ts`                           | **new** — `getCollege(code)` helper                                                              |
| `web/src/lib/predict.ts`                            | source college names via `getCollege` (remove the duplicate name field from `data.json` lookups) |
| `web/src/app/college/[code]/page.tsx`               | **new** — static dynamic route                                                                   |
| `web/src/components/college/CollegeHero.tsx`        | **new**                                                                                          |
| `web/src/components/college/PlacementStrip.tsx`     | **new**                                                                                          |
| `web/src/components/college/PodcastEmbed.tsx`       | **new**                                                                                          |
| `web/src/components/college/CollegeCutoffTable.tsx` | **new**                                                                                          |
| `web/src/components/ResultRow.tsx`                  | wrap college name in `<Link>` to `/college/[code]?rank=…`                                        |
| `web/src/components/Predictor.tsx`                  | thread `rank` down to `ResultRow`                                                                |
| `web/src/app/globals.css`                           | extract footer signature's underline-wipe into a reusable `.linkmark` class                      |
| `web/scripts/build-colleges.mjs`                    | **new** — migration of college names from `data.json` → `colleges.ts`                            |
| `web/scripts/seed-from-template.mjs`                | **new** — patch top-15 metadata from `docs/data-template.md`                                     |
| `docs/data-template.md`                             | **new** — filling guide for top 15 colleges                                                      |

## Verification

1. `cd web && ./node_modules/.bin/tsc --noEmit` — clean.
2. `npm run build` — `generateStaticParams` pre-renders 150 college routes. Output should list `/college/E001`, `/college/E003`, ….
3. From the predictor, type rank 12,000, click any college code → lands on `/college/E095?rank=12000`, cut-off table shows fit bars and tier labels; browser back returns to the predictor with the rank preserved.
4. Direct visit to `/college/E095` (no rank query) → no fit bars, plain cut-off table.
5. Direct visit to a long-tail college with no metadata (e.g. `/college/E209`) → hero shows just name + code, placement says "not yet published", podcast section is absent. No layout breakage.
6. New Playwright script `web/scripts/snap-college.mjs` captures `/college/E095?rank=12000`, `/college/E095`, and `/college/E209` for visual regression.

## Aesthetic checks (must stay cohesive with the predictor)

- Same fonts, same brass accent, same hairline rhythm.
- No new colors, no card stacks, no new component visual language.
- Eyebrow

s use the existing `.eyebrow` class.

- Codes, ranks, established years, LPA figures all in mono (matches the app's tabular vocabulary).
- Each section follows the predictor's pattern: hairline rule → eyebrow label → content.

## Non-goals for v2

- Search / compare across colleges.
- Slug URLs (code-based is fine for now).
- Standard or comprehensive placement schema (revisit after the minimal v2 lands and the top 15 are populated).
- CSV/spreadsheet ingestion script (later).
- Per-college "Apply" / "Counselling" CTAs — out of scope.
