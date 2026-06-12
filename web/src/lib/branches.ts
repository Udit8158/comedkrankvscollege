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
]);

const ELECTRONICS = new Set([
  "EC", "ECE", "ECV", "EE", "EI", "ET", "MD", "VL", "VLS",
]);

const CORE = new Set([
  "ME", "CV", "CCA", "CCS", "CK", "CH", "IM", "IP",
  "MAE", "MT", "AE", "AS", "AU", "AVE", "MR", "BT", "BM",
  "CC", "TX", "RA", "ROB", "AG", "AL", "AR",
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
  // electronics
  EC: 0, ECE: 1, EE: 2, ECV: 3, VL: 4, VLS: 5, EI: 6, ET: 7, MD: 8,
  // core
  ME: 0, CV: 1, EE_C: 1, CH: 2, BT: 3, BM: 4, MT: 5, IM: 6, IP: 7,
  MAE: 8, AE: 9, AS: 10, AU: 11, AVE: 12, MR: 13, RA: 14, ROB: 15,
  AR: 16, AG: 17, AL: 18, CC: 19, TX: 20, CCA: 21, CCS: 22, CK: 23,
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
export function cleanBranchName(name: string): string {
  return name
    .replace(/-\s+/g, "")
    .replace(/(\w)\s+(?=\w{1,3}\b)/g, (_m, p1, _o, _s) => p1) // soft-fix tiny splits, conservative
    .replace(/\s{2,}/g, " ")
    .replace(/Communicati on/g, "Communication")
    .replace(/Communica- tion/g, "Communication")
    .replace(/Telecommu- nication/g, "Telecommunication")
    .replace(/Instrumentati on/g, "Instrumentation")
    .replace(/Bio- /g, "Bio")
    .replace(/Communic- ation/g, "Communication")
    .trim();
}
