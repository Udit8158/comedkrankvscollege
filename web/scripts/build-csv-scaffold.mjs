// Emits data/colleges.csv with one row per college from colleges.ts.
// Existing fields (code, name, locality, city, podcast.youtubeId) are pre-filled
// for context. Research-target columns (established, type, website, placement_*,
// about, sources, confidence, notes) start empty.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const TS_PATH = path.join(ROOT, "web", "src", "data", "colleges.ts");
const OUT = path.join(ROOT, "data", "colleges.csv");

const src = fs.readFileSync(TS_PATH, "utf8");

// Parse each `{ code: "...", name: "...", ... }` entry into an object literal.
// The file is hand-formatted multiline; one entry per `{ … },` block within COLLEGES = [ ... ].
const arrayStart = src.indexOf("COLLEGES");
const body = src.slice(arrayStart);

// Capture each entry block.
const entryRe = /\{\s*code:\s*"(E\d+)",\s*name:\s*"([^"]+)"(?:,\s*locality:\s*"([^"]*)")?(?:,\s*city:\s*"([^"]*)")?(?:[^}]*?podcast:\s*\{\s*youtubeId:\s*"([^"]+)")?[^}]*\}/g;

const headers = [
  "code",
  "name",
  "locality",
  "city",
  "established_year",
  "type",
  "website",
  "placement_cse_avg_lpa",
  "placement_overall_avg_lpa",
  "placement_year",
  "about",
  "podcast_youtube_id",
  "sources",
  "confidence",
  "notes",
];

const csvEscape = (s = "") => {
  if (s === null || s === undefined) return "";
  const str = String(s);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const rows = [headers.join(",")];
let count = 0;
for (const m of body.matchAll(entryRe)) {
  const [, code, name, locality = "", city = "", youtubeId = ""] = m;
  rows.push(
    [
      code,
      name,
      locality,
      city,
      "", // established_year
      "", // type
      "", // website
      "", // placement_cse_avg_lpa
      "", // placement_overall_avg_lpa
      "", // placement_year
      "", // about
      youtubeId,
      "", // sources
      "", // confidence
      "", // notes
    ]
      .map(csvEscape)
      .join(","),
  );
  count++;
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, rows.join("\n") + "\n");
console.log(`wrote ${count} rows → ${OUT}`);
