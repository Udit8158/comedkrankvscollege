// Reads data/colleges.csv and re-emits web/src/data/colleges.ts.
// Strategy:
//   1. Read the CSV — single source of truth for college metadata.
//   2. Read the existing colleges.ts so we can preserve any podcast titles
//      that were hand-set there (the CSV only stores the youtube id).
//   3. Re-emit a clean colleges.ts where every CSV row becomes one entry,
//      with only the non-empty fields written out.
//
// Idempotent: running multiple times produces the same output.
//
// `buildCollegesTs()` is exported (pure, no writes) so scripts/validate-data.mjs
// can recompute the expected output and assert colleges.ts is in sync with the CSV.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const CSV = path.join(ROOT, "data", "colleges.csv");
const TS = path.join(ROOT, "web", "src", "data", "colleges.ts");

function parseCsvLine(line) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

function tsEsc(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function emit(e) {
  const L = ["  {"];
  L.push(`    code: "${e.code}",`);
  L.push(`    name: "${tsEsc(e.name)}",`);
  if (e.locality) L.push(`    locality: "${tsEsc(e.locality)}",`);
  if (e.city) L.push(`    city: "${tsEsc(e.city)}",`);
  if (e.established) L.push(`    established: ${e.established},`);
  if (e.type) L.push(`    type: "${e.type}",`);
  if (e.website) L.push(`    website: "${tsEsc(e.website)}",`);
  if (e.about) L.push(`    about: "${tsEsc(e.about)}",`);
  if (e.placement) {
    const p = e.placement;
    L.push("    placement: {");
    if (p.cseAvgLpa !== undefined) L.push(`      cseAvgLpa: ${p.cseAvgLpa},`);
    if (p.overallAvgLpa !== undefined) L.push(`      overallAvgLpa: ${p.overallAvgLpa},`);
    if (p.year !== undefined) L.push(`      year: ${p.year},`);
    L.push("    },");
  }
  if (e.podcast) {
    L.push("    podcast: {");
    L.push(`      youtubeId: "${tsEsc(e.podcast.youtubeId)}",`);
    if (e.podcast.title) L.push(`      title: "${tsEsc(e.podcast.title)}",`);
    L.push("    },");
  }
  L.push("  },");
  return L.join("\n");
}

const HEADER = `// GENERATED FILE — DO NOT EDIT BY HAND.
//
// Source of truth: data/colleges.csv. Edit that file, then regenerate with:
//   node web/scripts/merge-csv-to-colleges.mjs
//
// The \`code\` field is the primary key and must match cut-off records in
// src/data.json. To add a brand-new college code, follow the update playbook in
// CLAUDE.md (build-colleges.mjs seeds the code, then add a CSV row + re-merge).

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

/**
 * Build the colleges.ts source string from data/colleges.csv.
 * Pure — performs no writes. Reads the current colleges.ts only to preserve
 * hand-set podcast titles.
 */
export function buildCollegesTs() {
  const csv = fs.readFileSync(CSV, "utf8").replace(/\r\n/g, "\n").trim();
  const [headerLine, ...rows] = csv.split("\n");
  const headers = parseCsvLine(headerLine);
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));

  // Preserve podcast titles already present in colleges.ts
  const oldTs = fs.existsSync(TS) ? fs.readFileSync(TS, "utf8") : "";
  const titleByCode = new Map();
  const reBlock = /code:\s*"(E\d+)"[\s\S]*?podcast:\s*\{[\s\S]*?youtubeId:\s*"[^"]+",[\s\S]*?title:\s*"([^"]+)"/g;
  for (const m of oldTs.matchAll(reBlock)) titleByCode.set(m[1], m[2]);

  const entries = [];
  for (const row of rows) {
    if (!row.trim()) continue;
    const cells = parseCsvLine(row);
    const get = (k) => {
      const v = cells[idx[k]];
      return (v ?? "").trim();
    };
    const code = get("code");
    if (!code) continue;

    const meta = { code, name: get("name") };
    const locality = get("locality"); if (locality) meta.locality = locality;
    const city = get("city"); if (city) meta.city = city;

    const est = get("established_year");
    if (est) {
      const n = Number(est);
      if (Number.isFinite(n)) meta.established = n;
    }

    const type = get("type");
    if (type) meta.type = type;

    const website = get("website"); if (website) meta.website = website;
    const about = get("about"); if (about) meta.about = about;

    const cse = get("placement_cse_avg_lpa");
    const overall = get("placement_overall_avg_lpa");
    const year = get("placement_year");
    if (cse || overall || year) {
      meta.placement = {};
      if (cse) { const n = Number(cse); if (Number.isFinite(n)) meta.placement.cseAvgLpa = n; }
      if (overall) { const n = Number(overall); if (Number.isFinite(n)) meta.placement.overallAvgLpa = n; }
      if (year) { const n = Number(year); if (Number.isFinite(n)) meta.placement.year = n; }
      if (Object.keys(meta.placement).length === 0) delete meta.placement;
    }

    const youtubeId = get("podcast_youtube_id");
    if (youtubeId) {
      meta.podcast = { youtubeId };
      const title = titleByCode.get(code);
      if (title) meta.podcast.title = title;
    }

    entries.push(meta);
  }

  return HEADER + entries.map(emit).join("\n") + "\n];\n";
}

// CLI: write colleges.ts when this script is run directly.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const out = buildCollegesTs();
  fs.writeFileSync(TS, out);
  const n = (out.match(/code:\s*"E\d+"/g) || []).length;
  console.log(`wrote ${n} entries → ${TS}`);
}
