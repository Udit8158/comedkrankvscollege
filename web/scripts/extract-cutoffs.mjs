#!/usr/bin/env node
/**
 * Turn COMEDK's "Cut-off Ranks after Round 3 Allotment" PDF into `src/data.json`.
 *
 * This is the script CLAUDE.md spent a year describing as "no committed script
 * yet — re-do the pdfplumber inline extraction". It is the one step in the
 * whole pipeline that ran once a year, by hand, and could not be reproduced.
 *
 *   node scripts/extract-cutoffs.mjs <pdf> [--out src/data.json]
 *
 * Needs `pdftotext` (poppler: `brew install poppler`) and nothing else — the
 * original used pdfplumber, but a yearly script that needs a Python
 * environment stood up first is a yearly script that rots.
 *
 * ── How the PDF is shaped ──────────────────────────────────────────────────
 * It is an Excel export: one row per college, one column per branch, the cell
 * holding the closing rank. Too wide for a page, so it is tiled — ~18 colleges
 * by 6 branches per page, the college block repeating for each group of branch
 * columns. 117 pages in 2026.
 *
 * Parsing the visual layout (`pdftotext -layout`) means guessing columns from
 * runs of spaces, and header cells wrap across three lines, so the guesses are
 * wrong in exactly the places that matter. Instead this reads word bounding
 * boxes (`-bbox-layout`) and assigns each number to a branch by x-position.
 * The columns are an Excel grid, so they are dead regular: ~55.7pt apart,
 * which is far more than the tolerance below.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/** Half a row's height, used only for the first and last row on a page, where
 *  there is no neighbour to take the midpoint against. */
const ROW_HALF_PITCH = 8.5;
/** A branch header must sit at least this far right of the college-code column,
 *  which keeps the hyphen in the page title from reading as a branch. */
const MIN_HEADER_OFFSET = 200;
/** Half the column pitch. A number further than this from every branch anchor
 *  is not in a column and is dropped rather than guessed at. */
const COLUMN_TOLERANCE = 25;

const WORD_RE =
  /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)<\/word>/g;

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function wordsFor(pdfPath) {
  const dir = mkdtempSync(join(tmpdir(), "comedk-"));
  const out = join(dir, "bbox.xml");
  try {
    execFileSync("pdftotext", ["-bbox-layout", pdfPath, out], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    const xml = readFileSync(out, "utf8");
    // One entry per page, so a branch column on page 7 can never be confused
    // with the same x-position on page 8 (different branch group).
    return xml.split("<page ").slice(1).map((page) => {
      const words = [];
      for (const m of page.matchAll(WORD_RE)) {
        words.push({
          x: (parseFloat(m[1]) + parseFloat(m[3])) / 2,
          xMin: parseFloat(m[1]),
          xMax: parseFloat(m[3]),
          y: parseFloat(m[2]),
          text: decode(m[5]),
        });
      }
      return words;
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Reassemble a block of words that wraps across lines.
 *
 * Words are read top-to-bottom, left-to-right. A line ending in a hyphen is
 * a word COMEDK broke across the wrap, so it closes up with no space; every
 * other line join takes one.
 */
function joinWrapped(words) {
  const lines = new Map();
  for (const w of words) {
    const key = Math.round(w.y);
    if (!lines.has(key)) lines.set(key, []);
    lines.get(key).push(w);
  }
  let out = "";
  for (const key of [...lines.keys()].sort((a, b) => a - b)) {
    const text = lines
      .get(key)
      .sort((a, b) => a.x - b.x)
      .map((w) => w.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    if (!out) out = text;
    else if (out.endsWith("-")) {
      // A hyphen at a line end is doing one of two jobs, and they need
      // opposite treatment. Lowercase after the wrap means COMEDK broke a
      // single word ("Telecommu-" / "nication"), so the hyphen goes. Uppercase
      // means it is a real separator that happens to have landed at the edge
      // ("…Technology-" / "Moodbidri, Mangaluru"), so it stays.
      out = /^[a-z]/.test(text) ? out.slice(0, -1) + text : out + text;
    } else out += " " + text;
  }
  return out.trim();
}

/**
 * Where the header ends and the table starts, for this page.
 *
 * Not a constant. The last page of each branch group carries only the tail of
 * the college list, and COMEDK's export pushes that short table down the page:
 * the header sits at y≈218 there against y≈131 on a full page. A fixed
 * boundary silently skipped every one of those pages — ten colleges and two
 * branches that appear nowhere else — so it is derived from the first college
 * row instead, which is the thing the boundary actually means.
 */
function headerCutoff(words) {
  let firstRow = Infinity;
  for (const w of words) {
    if (/^E\d{3}$/.test(w.text) && w.y < firstRow) firstRow = w.y;
  }
  return firstRow;
}

/**
 * The x the college-code column sits at, for this page.
 *
 * Also not a constant, and for the same reason as `headerCutoff`. The last
 * branch group has only three columns left to show, so COMEDK's export
 * centres that narrow table and everything shifts right — codes land at
 * x≈164 against x≈72 on a full page, and the seat category at x≈490 against
 * x≈398. Fixed x bounds read those pages as having no college rows at all.
 */
function codeColumnX(words, headerY) {
  for (const w of words) {
    if (w.y >= headerY && /^E\d{3}$/.test(w.text)) return w.x;
  }
  return 0;
}

/**
 * Branch columns on a page: the code, and the x it is centred on.
 *
 * COMEDK spells most headers "AD-Artificial Intelligence…" but a few "IAR -
 * Information Technology…", with a space the PDF tokenises into its own word.
 * Reading only the glued form loses those columns entirely — IAR and IDA are
 * two such, and they are the only place two of the 69 branches appear.
 */
function branchColumns(words, headerY, codeX) {
  const header = words.filter(
    (w) => w.y < headerY && w.x >= codeX + MIN_HEADER_OFFSET,
  );
  const cols = [];
  for (const w of header) {
    const glued = /^([A-Z]{2,4})-/.exec(w.text);
    if (glued) {
      cols.push({ code: glued[1], x: w.x, anchorY: w.y });
      continue;
    }
    if (!/^[A-Z]{2,4}$/.test(w.text)) continue;
    const split = header.some(
      (o) =>
        o !== w &&
        o.text === "-" &&
        Math.abs(o.y - w.y) < 1 &&
        o.xMin >= w.xMax &&
        o.xMin - w.xMax < 6,
    );
    if (split) cols.push({ code: w.text, x: w.x, anchorY: w.y });
  }
  return cols.sort((a, b) => a.x - b.x);
}

/**
 * The branch's full name, reassembled from the header cell.
 *
 * The cell wraps over up to four lines ("AIF-Computer" / "Science &" /
 * "Engineering -" / "AI and Future Technologies"), so it is every header word
 * within half a column of the anchor, read top-to-bottom. COMEDK also
 * hyphenates across the wrap ("AE-Aeronau-" + "tical"), which is why a
 * trailing hyphen joins with no space.
 */
function branchName(words, col, headerY) {
  const cell = words
    .filter(
      (w) =>
        w.y < headerY &&
        w.y >= col.anchorY - 1 &&
        Math.abs(w.x - col.x) <= COLUMN_TOLERANCE,
    )
    .sort((a, b) => a.y - b.y || a.x - b.x);

  let name = joinWrapped(cell);

  // Drop the code the anchor word carries. Done with the known code rather
  // than a pattern: the hyphen join closes "AE-" + "Aeronautical" into
  // "AEAeronautical", so by this point there is no separator left to match.
  if (name.startsWith(col.code)) name = name.slice(col.code.length);
  return name.replace(/^\s*-\s*/, "").replace(/\s+/g, " ").trim();
}

function extract(pdfPath) {
  const pages = wordsFor(pdfPath);
  const collegeNames = new Map(); // code -> name
  const branchNames = new Map(); // code -> name
  const records = new Map(); // `${college}|${branch}` -> rank
  const categories = new Set();
  let skipped = 0;

  for (const words of pages) {
    const headerY = headerCutoff(words);
    if (!Number.isFinite(headerY)) continue; // no college rows: a cover page
    const codeX = codeColumnX(words, headerY);
    const cols = branchColumns(words, headerY, codeX);
    if (cols.length === 0) continue;
    // Everything right of the first column's left edge is data. Derived from
    // the columns themselves so it travels with the table when it shifts.
    const dataLeft = Math.min(...cols.map((c) => c.x)) - COLUMN_TOLERANCE;
    for (const c of cols) {
      if (!branchNames.has(c.code)) {
        branchNames.set(c.code, branchName(words, c, headerY));
      }
    }

    // A college row is anchored by its E-code, not by a line of text. Long
    // names wrap across up to three lines and the code is set centred against
    // them, so "everything on the code's line" captures the ranks (they do sit
    // on that line) but loses most of the name. The row's band therefore runs
    // to the midpoint between this code and its neighbours.
    const anchors = words
      .filter((w) => w.y >= headerY && /^E\d{3}$/.test(w.text))
      .sort((a, b) => a.y - b.y);

    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];
      const prev = anchors[i - 1];
      const next = anchors[i + 1];
      const lo = prev ? (prev.y + anchor.y) / 2 : anchor.y - ROW_HALF_PITCH;
      const hi = next ? (anchor.y + next.y) / 2 : anchor.y + ROW_HALF_PITCH;
      const band = words.filter(
        (w) => w !== anchor && w.y >= headerY && w.y > lo && w.y < hi,
      );

      const code = anchor.text;
      // The seat category is the rightmost thing before the data columns.
      const left = band.filter((w) => w.x < dataLeft);
      const rightmost = left.reduce((a, b) => (b.x > a.x ? b : a), left[0]);
      const category =
        rightmost && /^[A-Z]{2,4}$/.test(rightmost.text) ? rightmost : null;
      if (category) categories.add(category.text);

      if (!collegeNames.has(code)) {
        // Joined a line at a time. A long name wraps, and COMEDK breaks it at
        // the hyphen that separates campus from city ("…Technology-" /
        // "Moodbidri, Mangaluru"), so a hyphen *at the end of a line* closes
        // up. Collapsing every "- " in the string instead would eat the
        // spaced separator real names use ("Shetty Institute of Technology -
        // Gulbarga"), which is a different character doing a different job.
        const name = joinWrapped(left.filter((w) => w !== category));
        if (name) collegeNames.set(code, name);
      }

      for (const w of band) {
        if (w.x < dataLeft) continue;
        if (!/^\d{1,6}$/.test(w.text)) continue;
        let best = null;
        let bestD = Infinity;
        for (const c of cols) {
          const d = Math.abs(w.x - c.x);
          if (d < bestD) { bestD = d; best = c; }
        }
        // A number that lines up with no column is page furniture — the
        // "Page 1 of 117" footer sits at x≈415, between the name block and the
        // first branch. Dropping it beats filing it under the nearest branch.
        if (!best || bestD > COLUMN_TOLERANCE) { skipped++; continue; }
        records.set(`${code}|${best.code}`, parseInt(w.text, 10));
      }
    }
  }

  return { collegeNames, branchNames, records, categories, skipped };
}

function main() {
  const args = process.argv.slice(2);
  const pdfPath = args.find((a) => !a.startsWith("--"));
  if (!pdfPath) {
    console.error("usage: node scripts/extract-cutoffs.mjs <pdf> [--out <path>]");
    process.exit(1);
  }
  const outIdx = args.indexOf("--out");
  const outPath = resolve(outIdx === -1 ? "src/data.json" : args[outIdx + 1]);

  const { collegeNames, branchNames, records, categories, skipped } =
    extract(resolve(pdfPath));

  const colleges = [...collegeNames.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, name]) => ({ code, name }));
  const branches = [...branchNames.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, name]) => ({ code, name }));
  const recordList = [...records.entries()]
    .map(([key, rank]) => {
      const [college, branch] = key.split("|");
      return { college, branch, rank };
    })
    .sort(
      (a, b) =>
        a.college.localeCompare(b.college) || a.branch.localeCompare(b.branch),
    );

  writeFileSync(
    outPath,
    JSON.stringify({ colleges, branches, records: recordList }, null, 2) + "\n",
  );

  console.log(`colleges   ${colleges.length}`);
  console.log(`branches   ${branches.length}`);
  console.log(`records    ${recordList.length}`);
  console.log(`categories ${[...categories].join(", ") || "(none seen)"}`);
  console.log(`skipped    ${skipped} numbers outside any column`);
  console.log(`→ ${outPath}`);
}

main();
