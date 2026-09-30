// Branch families. Order in array = display priority.
// Pure CSE first, then CSE specializations, then Electronics, then Core, then Other.

export type BranchFamily =
  | "cse"
  | "cse_spec"
  | "electronics"
  | "core";

// Pure CSE — just the `CS` code.
const CSE_PURE = new Set(["CS"]);

// CSE specializations + every adjacent "computing-ish" branch (Info Science,
// IT, AI/ML, Data Science, Robotics-AI). Anything that lives under the
// computing umbrella but isn't the plain `CS` code.
const CSE_SPEC = new Set([
  "CD", "CI", "CY", "CA", "CB", "CG", "CO", "CAD", "CIT",
  "CSB", "CSD", "CR", "CM", "CN", "IC", "CE", "ES", "UE",
  "IS", "IST", "INT", "IDA", "IAR", "DS", "CX",
  "AI", "AD", "RI", "CBD",
  // New in the 2026 Round 3 list. COMEDK keeps minting CSE flavours; each of
  // these is a CS degree with a specialisation in its name.
  "AIF", "CCC", "CP", "FSD", "SPE", "QC", "IFS", "ITE",
  // Electrical Engineering & Computer Science reads as electrical first, but
  // it is the branch a student comparing CS offers is weighing against them,
  // and burying it under core would hide it from exactly that reader.
  "EEC",
]);

const ELECTRONICS = new Set([
  "EC", "ECE", "ECV", "EE", "EI", "ET", "MD", "VL", "VLS",
  // New in 2026. ED is the code ECV became; EES and ELE are new.
  "ED", "EES", "ELE",
]);

const CORE = new Set([
  "ME", "CV", "CCA", "CCS", "CK", "CH", "IM", "IP",
  "MAE", "MT", "AE", "AS", "AU", "AVE", "MR", "BT", "BM",
  "CC", "TX", "RA", "ROB", "AG", "AL", "AR",
  // New in 2026. "Design Engineering" is an engineering degree — not one of
  // the B.Des programmes ignored below, which is a distinction worth keeping
  // straight because the names look alike.
  "DE", "RBE",
]);

// Branch codes intentionally excluded from the engineering predictor: design and
// planning programs. Listed explicitly so the data validator can tell a
// "deliberately ignored" code apart from a "newly added COMEDK code that fell
// through unclassified" (the latter should fail validation).
export const IGNORED_BRANCHES = new Set([
  "BD",  // Bachelor of Design
  "BDC", // B.Des — Communication & Design
  "BFD", // B.Des — Fashion Design
  "BID", // B.Des — Industrial Design
  "BLD", // B.Des — Lifestyle & Accessory Design
  "BP",  // Bachelor of Urban & Regional Planning
  // 2026 renamed the B.Des codes and added a planning one. The old codes stay
  // listed: they are what a re-run against an older PDF will produce.
  "DC",  // B.Des — Communication & Design
  "DF",  // B.Des — Fashion Design
  "DI",  // B.Des — Industrial Design
  "DL",  // B.Des — Lifestyle & Accessory Design
  "IMP", // Integrated Masters in Planning
]);

// Within-family sort: pure CS first inside computing, etc.
// Lower index = higher priority.
const INTRA_FAMILY_ORDER: Record<string, number> = {
  // computing: pure CS, then CS+specialization, then IS/IT, then AI/DS
  CS: 0, CD: 1, CI: 2, CY: 3, CA: 4, CB: 5, CG: 6, CO: 7,
  CAD: 8, CSB: 9, CSD: 10, CBD: 11, IC: 12, CR: 13, CN: 14,
  CM: 15, CE: 16, UE: 17, ES: 18, CIT: 19,
  IS: 20, IST: 21, INT: 22, IDA: 23, IAR: 24, CX: 25,
  AI: 26, AD: 27, DS: 28, RI: 29,
  CP: 30, AIF: 31, CCC: 32, FSD: 33, SPE: 34, QC: 35,
  IFS: 36, ITE: 37, EEC: 38,
  // electronics
  EC: 0, ECE: 1, EE: 2, ECV: 3, ED: 4, VL: 5, VLS: 6, EES: 7,
  ELE: 8, EI: 9, ET: 10, MD: 11,
  // core
  ME: 0, CV: 1, EE_C: 1, CH: 2, BT: 3, BM: 4, MT: 5, IM: 6, IP: 7,
  MAE: 8, AE: 9, AS: 10, AU: 11, AVE: 12, MR: 13, RA: 14, ROB: 15,
  AR: 16, AG: 17, AL: 18, CC: 19, TX: 20, CCA: 21, CCS: 22, CK: 23,
  RBE: 14, DE: 24,
};

// Returns null for branches outside the engineering scope (Bachelor of Design,
// Bachelor of Urban Planning, etc.) — those records are dropped from results.
export function familyOf(code: string): BranchFamily | null {
  if (CSE_PURE.has(code)) return "cse";
  if (CSE_SPEC.has(code)) return "cse_spec";
  if (ELECTRONICS.has(code)) return "electronics";
  if (CORE.has(code)) return "core";
  return null;
}

const FAMILY_RANK: Record<BranchFamily, number> = {
  cse: 0,
  cse_spec: 1,
  electronics: 2,
  core: 3,
};

export function familyRank(code: string): number {
  const f = familyOf(code);
  return f === null ? Infinity : FAMILY_RANK[f];
}

export function intraFamilyRank(code: string): number {
  return INTRA_FAMILY_ORDER[code] ?? 99;
}

export const FAMILY_LABEL: Record<BranchFamily, string> = {
  cse: "computer science",
  cse_spec: "cse specializations",
  electronics: "electronics",
  core: "core engineering",
};

// Cleanup of branch names — the PDF has wrapped words like "Communicati on"
/**
 * Words COMEDK's column headers break across a line, and what they should be.
 *
 * Listed one by one rather than inferred. The previous version also carried a
 * blanket "join a word to any 1-3 letter word after it" rule, meant to catch
 * new splits automatically; what it actually did was eat the space in front of
 * every short *real* word — "Electronics and Communication" rendered as
 * "Electronicsand Communication", and "Ceramic And Cement" as "CeramicAnd
 * Cement", on the live site. A rule that cannot tell the "on" in
 * "Communicati on" from the "and" in "Reality and Virtual" cannot be applied
 * blind, so it is not applied at all.
 *
 * A new year's PDF may wrap a word this list has not seen. That shows up as a
 * visible space inside a word rather than as a silently mangled name, and the
 * fix is a line here.
 */
const WRAPPED_WORDS: Array<[RegExp, string]> = [
  [/Communicati\s+on/g, "Communication"],
  [/Communicatio\s+n/g, "Communication"],
  [/Communica-\s+tion/g, "Communication"],
  [/Communic-\s+ation/g, "Communication"],
  [/Telecommu-\s+nication/g, "Telecommunication"],
  [/Instrumentati\s+on/g, "Instrumentation"],
  [/Bio-\s+/g, "Bio"],
  [/V\s+LSI/g, "VLSI"],
];

export function cleanBranchName(name: string): string {
  let out = name.replace(/-\s+/g, "").replace(/\s{2,}/g, " ");
  for (const [pattern, replacement] of WRAPPED_WORDS) {
    out = out.replace(pattern, replacement);
  }
  return out.trim();
}
