# CLAUDE.md

COMEDK rank-to-college predictor. Next.js + Tailwind app in `web/`. See `README.md` for end-user description.

## Data architecture — two independent tracks

```
┌─ TRACK 1 ─ Cut-off data (rank ↔ college/branch) ────────────────┐
│                                                                  │
│   Engineering_…2025.pdf   ──[ one-off pdfplumber extraction ]──▶ │
│       (repo root)              (no committed script yet)         │
│                                                                  │
│   web/src/data.json   ◀── what the app actually imports          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌─ TRACK 2 ─ College metadata (placement, podcast, etc.) ─────────┐
│                                                                  │
│   data/colleges.csv   ──[ web/scripts/merge-csv-to-colleges.mjs ]│
│   (editable source)              │                               │
│                                  ▼                               │
│   web/src/data/colleges.ts   ◀── generated; do NOT hand-edit     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

The two tracks link by the `code` field (`E001`, `E095`, …).

## Update playbook

| Scenario                                                   | Edit                                                                                                                                                                               | Run                                                                                                           | Commit                   |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------ |
| New year's COMEDK PDF                                      | Replace PDF at repo root                                                                                                                                                           | (no committed script yet — re-do the pdfplumber inline extraction, then copy the JSON to `web/src/data.json`) | both                     |
| Placement / podcast / about / established / type / website | `data/colleges.csv`                                                                                                                                                                | `node web/scripts/merge-csv-to-colleges.mjs`                                                                  | both CSV + `colleges.ts` |
| New college code added by COMEDK                           | (1) Update PDF first → regen `data.json`. (2) `node web/scripts/build-colleges.mjs` to append the new code to colleges.ts. (3) Add a row in `data/colleges.csv`. (4) Re-run merge. | both scripts                                                                                                  | all three                |
| Typo in name / locality / city                             | `data/colleges.csv`                                                                                                                                                                | merge script                                                                                                  | both                     |

**Golden rule:** `web/src/data/colleges.ts` is generated. Don't hand-edit. Edit the CSV and re-run the merge.

## Source-of-truth files

| File                       | What                                 | Editable?                                |
| -------------------------- | ------------------------------------ | ---------------------------------------- |
| `Engineering_…2025.pdf`    | Source for cut-off data              | No (official PDF)                        |
| `data/colleges.csv`        | Source for college metadata          | **Yes — this is where you make changes** |
| `web/src/data.json`        | Parsed cut-offs the app reads        | Generated from PDF                       |
| `web/src/data/colleges.ts` | Typed college metadata the app reads | Generated from CSV                       |

`data/colleges.csv.README.md` has the column-by-column guide for the CSV.

## Conventions to keep

- **No hand-edits to `colleges.ts`** — round-trip your change through the CSV.
- **Commit CSV + generated TS together** — never let them drift.
- **Confidence flags in CSV** — `high` / `medium` / `low`; cite `sources` (domains, official site first).
- **Empty cells are honest** — don't invent placement figures.

## Project quirks

- COMEDK GM data only — the PDF has no other reservation categories.
- 9 colleges have student-podcast YouTube IDs from the user's @mindcreed23 channel; long-tail colleges have podcast = absent (component returns null).
- Predictor result sort: `cse → cse_spec → electronics → core` (no "other" — design/planning branches filtered out).
- Per-college pages live at `/college/[code]` and accept `?rank=…` for fit-bar context.

## Branches

- `main` — production. Has Vercel Analytics.
- `experimental` — work-in-progress. No analytics. Predates the `data/` reorg.

## Personal config

- Co-authored-by trailer (Claude) is **kept** on commits (user confirmed).
- Hands-free execution authorized for this project — no per-action permission prompts needed. Scope: this project only.
