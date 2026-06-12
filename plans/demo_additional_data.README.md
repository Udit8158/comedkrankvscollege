# `demo_additional_data.csv` — review notes

Companion to `plans/demo_additional_data.csv`. Read this first so the
numbers in the CSV are easier to judge.

## Coverage at a glance

| Bucket | Filled | Description |
|---|---|---|
| Tier 1 — top brand + podcast colleges | **17** | RVCE, BMSCE, MSRIT, BMSIT, DSCE, BIT, SIT Tumkur, JSSSTU (SJCE), NIE North + South, REVA, Sir MVIT, CMRIT, Cambridge, RNSIT, SJBIT, RVITM |
| Tier 2 — well-known mid-tier | **17** | Acharya, AMC, BNMIT, KLE Tech, BIET Davangere, BEC Bagalkot, JSSATE, PESCE Mandya, PESITM Shivamogga, SJCIT, Sapthagiri NPS, VVCE Mysuru, Alliance, GITAM, Presidency, CMRU, MSRUAS |
| Tier 3 — additional notable Bengaluru/Karnataka | **12** | Atria, BTI, DBIT, Dr. AIT, EPCET, GAT, KSSEM, KSIT, NCET, RRCE, SVIT, Jyothy IT |
| Long tail (unfilled) | 104 | Mostly small private VTU-affiliated colleges; sparse online presence |
| **Total in CSV** | **150** | Same row count as `colleges.ts` |

`46` rows are research-filled; `104` rows have only the seeded fields
(code, name, locality, city, podcast id where applicable).

## Columns

| Column | Required? | Notes |
|---|---|---|
| code | seeded | Primary key; matches `colleges.ts` and the cut-off records. |
| name / locality / city | seeded | Pulled from `colleges.ts` — do not modify here. |
| established_year | researched | Year of founding of the engineering college (not the parent trust). |
| type | researched | one of: `private` · `autonomous` · `deemed` · `government` · `university` |
| website | researched | Canonical institution URL. Cross-checked against the trust's own site where possible. |
| placement_cse_avg_lpa | researched | Average package for the CSE branch only. Often unpublished; blank when sources disagree. |
| placement_overall_avg_lpa | researched | Across all branches. Where the college only reports a *median*, that figure is used and `notes` flags it. |
| placement_year | researched | The cycle the figure applies to. `2024` unless noted; `2025` where the official 2024 figures weren't released. |
| about | researched | 1-2 sentence neutral description: trust/owner, locality, one differentiator. |
| podcast_youtube_id | seeded | From the 9 podcasts plugged in earlier; do not edit. |
| sources | researched | Comma-separated **domains** I cross-checked, ordered by weight (official site first). |
| confidence | researched | `high` (≥3 corroborating sources + figures agree) · `medium` (sources disagree by 1-3 LPA or year is debated) · `low` (single source / officially unpublished) |
| notes | researched | Caveats. Cross-verify before publishing. |

## Reading the confidence flags

- **high** — official site + at least two reputable aggregators agree. Safe to copy into `colleges.ts` as-is.
- **medium** — there's a real source but figures vary, or the field involves a judgment call (e.g., type = "private" vs "autonomous" depends on cut-off year). Glance at the `notes` field before accepting.
- **low** — either the college doesn't publish data, or I had to estimate from student reviews / median-only NIRF numbers. Verify before trusting.

## Things I deliberately did *not* do

- I did **not** modify `web/src/data/colleges.ts` — this CSV is the proposal only, per your instruction to review first.
- I did **not** fill placement figures for the long-tail 104 colleges. Many of them don't publish averages; pulling speculative numbers would hurt more than help.
- I did **not** invent `about` copy for colleges I couldn't verify. Empty is honest; a templated description for every college would read as AI fluff.
- I did **not** distinguish CSE avg from Overall avg where the source only published one combined figure. CSE avg is empty in those rows.

## How to apply (when ready)

Once you've reviewed the CSV and made corrections in-place:

1. The merger step is mechanical — a tiny script reads the CSV and patches `web/src/data/colleges.ts` row-by-row, only overwriting fields where the CSV cell is non-empty. I'll write that as a one-shot when you green-light the data.
2. Long-tail rows with empty research fields will be no-ops (the script will skip empty cells).
3. After applying, re-run `web/scripts/test-colleges.mts` and `web/scripts/snap-college.mjs` to verify the per-college pages render the new data correctly.

## Source-domain shorthand

| Shorthand | Reliability for this purpose |
|---|---|
| `<college-domain>.ac.in` / `.edu.in` | Highest — official |
| `en.wikipedia.org` | High for establishment year + type; not for placement |
| `careers360.com` | Reliable for placement + admissions |
| `shiksha.com` | Reliable for placement; less so for older history |
| `collegedunia.com` | Useful for cross-check; can lag |
| `collegedekho.com` | Useful for cross-check |
| `comedk.org` | Authoritative for COMEDK seat data; sparse on placement |
| `nirf.gov.in` (NIRF) | Authoritative for median packages of NIRF-participating colleges |
