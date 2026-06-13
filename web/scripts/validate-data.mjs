// Data integrity validator for the COMEDK predictor.
//
//   node web/scripts/validate-data.mjs   (or: npm run validate)
//
// Checks the data the whole app depends on and exits non-zero on any error:
//   - colleges.ts is in sync with data/colleges.csv (drift guard)
//   - CSV is well-formed (15 columns) and codes match colleges.ts
//   - cut-off records reference known college codes, with no duplicates
//   - every branch code in the records is classified or explicitly ignored
//   - confidence flags are valid
// Warnings (non-fatal) are printed for researched rows missing a source.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCollegesTs } from "./merge-csv-to-colleges.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const CSV = path.join(ROOT, "data", "colleges.csv");
const TS = path.join(ROOT, "web", "src", "data", "colleges.ts");
const DATA_JSON = path.join(ROOT, "web", "src", "data.json");
const BRANCHES = path.join(ROOT, "web", "src", "lib", "branches.ts");

const errors = [];
const warnings = [];
const ok = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const pass = (m) => ok.push(m);

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

// --- 1. CSV ↔ colleges.ts drift guard -------------------------------------
const tsOnDisk = fs.readFileSync(TS, "utf8");
const tsExpected = buildCollegesTs();
if (tsOnDisk !== tsExpected) {
  err(
    "colleges.ts is OUT OF SYNC with data/colleges.csv. " +
      "Run `node web/scripts/merge-csv-to-colleges.mjs` and commit the result.",
  );
} else {
  pass("colleges.ts is in sync with data/colleges.csv");
}

// --- 2. CSV well-formed (15 columns) --------------------------------------
const csvText = fs.readFileSync(CSV, "utf8").replace(/\r\n/g, "\n").trim();
const [headerLine, ...rowLines] = csvText.split("\n");
const headers = parseCsvLine(headerLine);
const col = Object.fromEntries(headers.map((h, i) => [h, i]));
const EXPECTED_COLS = headers.length; // 15

const csvCodes = new Set();
const rows = [];
for (const line of rowLines) {
  if (!line.trim()) continue;
  const cells = parseCsvLine(line);
  const code = cells[0];
  if (cells.length !== EXPECTED_COLS) {
    err(`CSV row ${code || "?"} has ${cells.length} columns (expected ${EXPECTED_COLS})`);
  }
  csvCodes.add(code);
  rows.push(cells);
}
if (rows.every((r) => r.length === EXPECTED_COLS)) {
  pass(`${rows.length} CSV rows, all ${EXPECTED_COLS} columns`);
}

// --- 3. CSV codes ↔ colleges.ts codes parity ------------------------------
const tsCodes = new Set([...tsOnDisk.matchAll(/code:\s*"(E\d+)"/g)].map((m) => m[1]));
const missingInTs = [...csvCodes].filter((c) => !tsCodes.has(c));
const missingInCsv = [...tsCodes].filter((c) => !csvCodes.has(c));
if (missingInTs.length) err(`codes in CSV but not colleges.ts: ${missingInTs.join(", ")}`);
if (missingInCsv.length) err(`codes in colleges.ts but not CSV: ${missingInCsv.join(", ")}`);
if (!missingInTs.length && !missingInCsv.length) {
  pass(`CSV ↔ colleges.ts codes match (${csvCodes.size})`);
}

// --- 4. cut-off records: known colleges, no duplicates --------------------
const data = JSON.parse(fs.readFileSync(DATA_JSON, "utf8"));
const branchName = Object.fromEntries(data.branches.map((b) => [b.code, b.name]));

const unknownColleges = new Set();
const seenPairs = new Set();
const dupPairs = [];
for (const r of data.records) {
  if (!csvCodes.has(r.college)) unknownColleges.add(r.college);
  const key = `${r.college}|${r.branch}`;
  if (seenPairs.has(key)) dupPairs.push(key);
  seenPairs.add(key);
}
if (unknownColleges.size) {
  err(`records reference unknown college codes: ${[...unknownColleges].join(", ")}`);
}
if (dupPairs.length) {
  err(`duplicate (college, branch) cut-off records: ${dupPairs.slice(0, 10).join(", ")}${dupPairs.length > 10 ? " …" : ""}`);
}
if (!unknownColleges.size && !dupPairs.length) {
  pass(`${data.records.length} cut-off records — no duplicates, all college codes known`);
}

// --- 5. branch classification coverage ------------------------------------
// Pull every quoted code out of the `new Set([...])` literals in branches.ts
// (CSE_PURE, CSE_SPEC, ELECTRONICS, CORE, IGNORED_BRANCHES).
const branchesSrc = fs.readFileSync(BRANCHES, "utf8");
const knownBranches = new Set();
for (const m of branchesSrc.matchAll(/new Set\(\[([\s\S]*?)\]\)/g)) {
  for (const cm of m[1].matchAll(/"([A-Za-z]+)"/g)) knownBranches.add(cm[1]);
}
const recordBranchCodes = new Set(data.records.map((r) => r.branch));
const unclassified = [...recordBranchCodes].filter((c) => !knownBranches.has(c));
if (unclassified.length) {
  err(
    "unclassified branch codes in records (add to a family in branches.ts, or to " +
      `IGNORED_BRANCHES): ${unclassified.map((c) => `${c} (${branchName[c] ?? "?"})`).join(", ")}`,
  );
} else {
  pass(`all ${recordBranchCodes.size} record branch codes are classified or ignored`);
}

// --- 6. confidence flags ---------------------------------------------------
const VALID_CONF = new Set(["", "high", "medium", "low"]);
const badConf = [];
for (const r of rows) {
  const c = (r[col.confidence] ?? "").trim();
  if (!VALID_CONF.has(c)) badConf.push(`${r[0]}="${c}"`);
}
if (badConf.length) err(`invalid confidence flags: ${badConf.join(", ")}`);
else pass("confidence flags valid");

// --- 7. researched rows missing sources (warning) -------------------------
const missingSources = [];
for (const r of rows) {
  const researched =
    (r[col.established_year] ?? "").trim() ||
    (r[col.type] ?? "").trim() ||
    (r[col.website] ?? "").trim() ||
    (r[col.about] ?? "").trim() ||
    (r[col.placement_cse_avg_lpa] ?? "").trim() ||
    (r[col.placement_overall_avg_lpa] ?? "").trim();
  if (researched && !(r[col.sources] ?? "").trim()) missingSources.push(r[0]);
}
if (missingSources.length) {
  warn(`${missingSources.length} researched rows missing sources: ${missingSources.join(", ")}`);
}

// --- 8. product-rule guard: family order (soft) ---------------------------
const frBlock = branchesSrc.match(/const FAMILY_RANK[\s\S]*?\{([\s\S]*?)\}/);
if (frBlock) {
  const order = [...frBlock[1].matchAll(/(\w+):\s*(\d+)/g)].map((m) => [m[1], Number(m[2])]);
  const expected = "cse,cse_spec,electronics,core";
  const got = order.sort((a, b) => a[1] - b[1]).map((x) => x[0]).join(",");
  if (got !== expected) warn(`FAMILY_RANK order is "${got}" (expected "${expected}") — verify predictor intent`);
}

// --- report ---------------------------------------------------------------
console.log("\nData validation");
for (const m of ok) console.log(`  ✓ ${m}`);
for (const m of warnings) console.log(`  ⚠ ${m}`);
for (const m of errors) console.log(`  ✗ ${m}`);

if (errors.length) {
  console.log(`\nFAIL — ${errors.length} error(s), ${warnings.length} warning(s)\n`);
  process.exit(1);
}
console.log(`\nPASS — ${warnings.length} warning(s)\n`);
