# comedkrankvscollege

A direct lookup against last year's official COMEDK Round 3 cut-offs. Enter a rank,
see which colleges and branches actually closed at or after it — computing branches
first, core last.

## What's here

- `Engineering_Cut_Off_Ranks_after_Round_3_Allotment__Notified_on_22_08_2025.pdf` —
  the official source PDF.
- `cutoffs.json` — parsed dataset (150 colleges · 69 branches · 508 GM cut-off
  records). Same file is mirrored at `web/src/data.json` for the app.
- `web/` — the Next.js + Tailwind + shadcn app.

## Run the app

```bash
cd web
npm install
npm run dev
```

Open <http://localhost:3000>.

## Notes

- Data is **General Merit only** — that's all the source PDF contains.
- "Last year is a hint, not a promise." Counselling rounds, management quota, and
  category seats are separate from this dataset.
