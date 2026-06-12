// One-shot generator: reads college names from src/data.json and emits a
// starter src/data/colleges.ts (single source of truth for college metadata).
//
// After the first run, colleges.ts is the source — edit it directly to add
// established year, placement data, podcast IDs, etc. Re-run this script ONLY
// to bring in new colleges from data.json without losing hand-curated fields.
// (The script appends new entries to the end and never overwrites existing
//  field values when present.)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_JSON = path.join(ROOT, "src", "data.json");
const OUT = path.join(ROOT, "src", "data", "colleges.ts");

function splitName(raw) {
  const dash = raw.indexOf("-");
  if (dash === -1) return { name: raw.trim() };
  const name = raw.slice(0, dash).trim();
  const rest = raw.slice(dash + 1).trim();
  const lastComma = rest.lastIndexOf(",");
  if (lastComma === -1) return { name, locality: rest };
  return {
    name,
    locality: rest.slice(0, lastComma).trim(),
    city: rest.slice(lastComma + 1).trim(),
  };
}

function escapeStr(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function entryLine({ code, name, locality, city }) {
  const parts = [`code: "${code}"`, `name: "${escapeStr(name)}"`];
  if (locality) parts.push(`locality: "${escapeStr(locality)}"`);
  if (city) parts.push(`city: "${escapeStr(city)}"`);
  return `  { ${parts.join(", ")} },`;
}

// --- Read existing source data ---
const data = JSON.parse(fs.readFileSync(DATA_JSON, "utf8"));
const fromJson = data.colleges.map((c) => ({ code: c.code, ...splitName(c.name) }));

// --- Preserve any hand-curated entries in colleges.ts ---
// Strategy: if colleges.ts exists, parse just the `code:` values out of it so
// we don't clobber rows the user has already enriched. The script only re-emits
// rows that were never in colleges.ts.
let existingCodes = new Set();
if (fs.existsSync(OUT)) {
  const cur = fs.readFileSync(OUT, "utf8");
  for (const m of cur.matchAll(/code:\s*"(E\d+)"/g)) existingCodes.add(m[1]);
  console.log(`existing entries preserved: ${existingCodes.size}`);
}

const newRows = fromJson.filter((r) => !existingCodes.has(r.code));
console.log(`new rows to write: ${newRows.length}`);

if (existingCodes.size === 0) {
  // Fresh write — emit the full module.
  const header = `// Single source of truth for college metadata.
//
// Edit this file directly to add or revise per-college information. The
// \`code\` field is the primary key and must match cut-off records in
// src/data.json. Run scripts/build-colleges.mjs to pull in any newly
// added colleges from data.json without overwriting curated fields.

export type CollegeMeta = {
  /** Primary key — matches cut-off records in data.json. */
  code: string;
  /** Headline college name, no locality suffix. */
  name: string;
  /** Sub-area, e.g. "Mysore Road" or "Yelahanka". */
  locality?: string;
  /** City, e.g. "Bengaluru". */
  city?: string;
  /** Year the institution was established. */
  established?: number;
  /** Affiliation type. */
  type?: "private" | "autonomous" | "deemed" | "government" | "university";
  /** Official website URL. */
  website?: string;
  /** 1-2 sentence description shown on the per-college hero. */
  about?: string;
  /** Latest placement stats — minimal v2 scope. */
  placement?: {
    /** Average package for CSE branch, in LPA. */
    cseAvgLpa?: number;
    /** Overall average package across branches, in LPA. */
    overallAvgLpa?: number;
    /** Year the figures are sourced from. */
    year?: number;
  };
  /** Student podcast on the user's YouTube channel, if any. */
  podcast?: {
    /** YouTube video ID (the part after \`v=\` in the watch URL). */
    youtubeId: string;
    /** Optional override for the embed title. */
    title?: string;
  };
};

export const COLLEGES: CollegeMeta[] = [
`;
  const body = newRows.map(entryLine).join("\n");
  const footer = `\n];\n`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, header + body + footer);
  console.log(`wrote ${OUT} with ${newRows.length} entries`);
} else if (newRows.length > 0) {
  // Append-only mode — splice new entries in just before the closing `];`.
  const cur = fs.readFileSync(OUT, "utf8");
  const insertAt = cur.lastIndexOf("];");
  if (insertAt === -1) throw new Error(`couldn't find closing ]; in ${OUT}`);
  const insert = newRows.map(entryLine).join("\n") + "\n";
  const out = cur.slice(0, insertAt) + insert + cur.slice(insertAt);
  fs.writeFileSync(OUT, out);
  console.log(`appended ${newRows.length} new entries to ${OUT}`);
} else {
  console.log("no new entries — colleges.ts is up to date");
}
