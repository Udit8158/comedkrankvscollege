# AGENTS.md

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

## Branding & lead capture

The tool ships under the **MindCreed** brand. The conversion surface is a
**callback form** — every CTA opens a dialog asking for a mobile number, with
the rank the student already typed pre-filled. WhatsApp is no longer the entry
point (a wa.me tap left no record to count or follow up); it is offered *after*
the number is captured, so the student still gets an instant conversation and
the lead is recorded either way.

`/api/leads` persists to Neon Postgres and the dashboard reads it back. The
`console.info("[lead]", …)` line is kept alongside the insert on purpose: it is
the recovery path on the day the database is unreachable. If the insert throws,
the request still returns `ok` — a student who sees "could not save your number"
over an infrastructure problem is a lead lost twice.

> ⚠️ **Still owed: notify-on-lead.** Nothing pings MindCreed when a callback
> request arrives, so a lead waits until someone opens the dashboard.

| Piece | File |
| --- | --- |
| Brand config, WhatsApp number, message copy | `web/src/lib/mindcreed.ts` |
| Lead contract — phone validation, payload type, `submitLead()` | `web/src/lib/leads.ts` |
| Intake endpoint (validate, rate-limit, insert) | `web/src/app/api/leads/route.ts` |
| The form dialog itself | `web/src/components/LeadDialog.tsx` |
| Single dialog instance + `useLead()` | `web/src/components/LeadContext.tsx` |
| The button that opens it | `web/src/components/LeadCTA.tsx` |
| Logo mark (monochrome SVG, `currentColor`) | `web/src/components/brand/MindCreedMark.tsx` |
| Sticky brand bar + ambient CTA | `web/src/components/SiteHeader.tsx` |
| The reusable lead block | `web/src/components/CounselCTA.tsx` |
| Rank sharing between predictor and header | `web/src/components/RankContext.tsx` |

Five CTA placements, all rank-aware: `header`, `results` (after the full list),
`no-matches` (the dead end — highest intent), `college` (names the campus), and
`footer`. The placement rides along on the lead, so the dashboard can show which
surface actually produces callbacks.

**Rules that keep it from becoming spam:**

- **Nothing is gated.** Every result stays free, and the form is never in the
  way of one. The obvious lead-farm move — five results then a phone-number
  wall — trades the YouTube channel's credibility for a worse CollegeDunia.
  Don't add it without the user asking.
- **The number is the only required field.** Every extra input is a place to
  abandon, and MindCreed can ask the rest on the call.
- **Never sell before the tool has worked.** No CTA on the empty state.
- **One brass button per view.** `.cta-brass` is the single warmest element on
  screen; a second one halves the value of both.
- **No invented claims.** Copy may reference what's verifiable: Bengaluru
  counselling, COMEDK/KCET/management-quota, the @mindcreed23 reviews. Not
  success rates, response times, or years in business.

Three Vercel Analytics events, all carrying `placement`, `rank` and `college`:
`lead_open` (dialog opened), `lead_submit` (number captured) and `whatsapp_cta`
(the post-capture handoff). `lead_open` → `lead_submit` is the conversion rate
per placement, so the lead flow is tunable against numbers rather than taste.

## The dashboard (`/dashboard`)

Staff-only view of captured leads. Neon Postgres for storage, Google OAuth for
sign-in, an env-var allowlist for authorisation.

**Route layout.** The root layout owns only the document, fonts, theme script
and analytics. The public chrome (brand bar, tier legend, footer) moved into the
`(site)` route group, so `/dashboard` and `/login` inherit none of it. No URL
changed — `(site)` is a group.

| Piece | File |
| --- | --- |
| Neon client (lazy; `hasDatabase()` guard) | `web/src/lib/db.ts` |
| Schema statements (idempotent, exported for testing) | `web/scripts/schema.mjs` |
| Migration runner | `web/scripts/db-migrate.mjs` |
| Every lead read/write, stats, CSV source | `web/src/lib/leads-store.ts` |
| Pipeline vocabulary (`new`/`contacted`/`converted`/`dropped`) | `web/src/lib/lead-status.ts` |
| Allowlist, canonical email, OAuth config | `web/src/lib/auth/config.ts` |
| Signed session cookie (HMAC, node:crypto) | `web/src/lib/auth/session.ts` |
| OAuth start / callback / signout | `web/src/app/api/auth/**` |
| The gate (auth guard, staff chrome) | `web/src/app/dashboard/layout.tsx` |
| The list, filters parsed from searchParams | `web/src/app/dashboard/page.tsx` |
| Status + note edits (re-check the session) | `web/src/app/dashboard/actions.ts` |
| Filtered CSV (own auth check) | `web/src/app/api/dashboard/export/route.ts` |
| Sign-in page | `web/src/app/login/page.tsx` |
| Dashboard-only CSS (`.dash-*`) | end of `web/src/app/globals.css` |

**Rules that keep it safe:**

- **Every server entry point checks the session itself.** The layout guard does
  not cover route handlers or server actions — those are POST endpoints with
  generated URLs. `actions.ts` and the export route each re-check.
- **The allowlist is re-read on every request**, not just at sign-in. Removing
  an address from `DASHBOARD_ALLOWED_EMAILS` locks that person out on their next
  request rather than a week later when the cookie expires.
- **An empty allowlist denies everyone.** Fails closed on purpose — never
  "unconfigured means open" on a page listing students' numbers.
- **Filtering is server-side.** Filters live in the URL so the page can stay a
  server component and query only the rows it renders. Never fetch all leads and
  filter in the browser — that ships every number the view is excluding.
- **No raw IPs are stored.** The rate limiter keys on a salted SHA-256 hash.
- **The captured context is immutable.** Only `status` and `note` are editable;
  rank, placement, college and phone are evidence of what the student did.
- **No `.cta-brass` on the dashboard.** There is no conversion to drive. The
  accent marks only what needs action — an unworked lead, an active filter.

**Env vars** — see `web/.env.example`. `DATABASE_URL`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `DASHBOARD_ALLOWED_EMAILS`, and optional
`AUTH_URL`. With none of them set the public tool runs unchanged and lead
capture degrades to log-only.

Google redirect URI, exactly: `<origin>/api/auth/callback/google`.

## The location filter

Students do not shop for a rank, they shop for a rank *in a place they are
willing to live*. `?in=` and `?area=` narrow the results to a region or to one
area inside it; the selection lives in the URL, so a filtered list is a
shareable link and survives a trip into a college page and back.

| Piece | File |
| --- | --- |
| City aliases, region map, Bengaluru sides, buckets | `web/src/lib/locations.ts` |
| `collegeCodes` option + `reachableCollegeCodes()` | `web/src/lib/predict.ts` |
| The two-row chip control | `web/src/components/LocationFilter.tsx` |
| Chip styling (`.geo-*`) | `web/src/app/globals.css` |

**Two rows, and what the second one holds depends on the region.** Everywhere
except Bengaluru the second row is cities, because they are genuinely different
cities — Mysuru is not Hassan. Bengaluru splits 59 / 4 / 1 across Bengaluru,
Bengaluru Rural and Chikkaballapur, so that split would ask a student to choose
between "Bengaluru" and "Bengaluru" and hand them nothing. There the second row
is **sides of the city** — north / east / south / west / outskirts — derived
from the `locality` column via `SIDE_BY_LOCALITY`.

**Rules that keep it honest:**

- **The filter runs inside `predict()`, never after it.** Family caps (5 CSE,
  10 specializations…) are applied to the *filtered* record set. Post-filtering
  a capped list would show a Mysuru student nothing at all, because the five
  best CSE seats in the state are all in Bengaluru.
- **No region is named after a city inside it.** "Bengaluru & around" — the
  "& around" is load-bearing, not decoration.
- **No "All" chip.** The lit region chip on the first row *is* the whole
  region; repeating it below makes three chips for two states. Pressing the lit
  region chip widens one level (area → whole region → anywhere), and an
  explicit `← all of <region>` appears only while narrowed.
- **Counts are colleges within reach, not matches.** A match count would be
  reporting where the family cap sits. The number answers "is there anything
  for me there", so its unit is colleges.
- **Only places that can ever appear get a chip.** Buckets are built from
  colleges present in `data.json`; Bidar and Kalaburagi have colleges but no
  Round 3 GM cut-offs, so a chip for them could only ever read `0`. A zero is
  reserved for "nothing here *at your rank*", which is a real answer and stays
  visible rather than vanishing as you type.
- **`SIDE_BY_LOCALITY` is local knowledge, not a boundary.** A Bengaluru
  locality missing from it lands in a visible "Elsewhere in the city" chip
  rather than being guessed at or silently dropped — that chip appearing is the
  signal to go add the locality.
- **The filtered dead end gets no CTA.** `NoneHere` is a state the tool created
  and the student can undo in one press — selling into it would be the cheapest
  kind of lead capture. `NoMatches` (nothing anywhere) keeps its CTA.
- **Filtered result copy must not overclaim.** With a filter on, the results CTA
  reads "every seat your rank reaches *in south Bengaluru*".
- **City spelling is canonicalised in the CSV**, with an alias table in
  `locations.ts` as the safety net so a future "Bangalore" row does not open a
  33rd bucket.

## Project quirks

- COMEDK GM data only — the PDF has no other reservation categories.
- 9 colleges have student-podcast YouTube IDs from the user's @mindcreed23 channel; long-tail colleges have podcast = absent (component returns null).
- Predictor result sort: `cse → cse_spec → electronics → core` (no "other" — design/planning branches filtered out).
- Per-college pages live at `/college/[code]` and accept `?rank=…` for fit-bar context.
- The home page accepts `?rank=…&in=<region>&area=<slug>` — all three are validated on read, so a hand-typed value falls back to "anywhere".

## Branches

- `main` — production. Has Vercel Analytics.
- rest, for each issues and pr from github, create a seperate branch and after reviewing from user, and merge to main, you will delete that branch

## Personal config

- Co-authored-by trailer (Codex) is **kept** on commits (user confirmed).
- Hands-free execution authorized for this project — no per-action permission prompts needed. Scope: this project only.
