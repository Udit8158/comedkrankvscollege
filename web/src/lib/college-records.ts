import raw from "@/data.json";
import { cleanBranchName, familyOf, familyRank } from "./branches";
import { tierAndFit } from "./fit";

type RawBranch = { code: string; name: string };
type RawRecord = { college: string; branch: string; rank: number };

const data = raw as { branches: RawBranch[]; records: RawRecord[] };
const branchByCode = new Map(
  data.branches.map((b) => [b.code, cleanBranchName(b.name)]),
);

/** Per-college view family — includes a catch-all "other" bucket so design,
 *  planning, and any branches outside the predictor's engineering scope still
 *  appear on the college page (they're filtered out of the predictor itself). */
export type CollegeFamily =
  | "cse"
  | "cse_spec"
  | "electronics"
  | "core"
  | "other";

export const COLLEGE_FAMILY_LABEL: Record<CollegeFamily, string> = {
  cse: "computer science",
  cse_spec: "cse specializations",
  electronics: "electronics",
  core: "core engineering",
  other: "other",
};

const COLLEGE_FAMILY_RANK: Record<CollegeFamily, number> = {
  cse: 0,
  cse_spec: 1,
  electronics: 2,
  core: 3,
  other: 4,
};

export type CollegeRecord = {
  branchCode: string;
  branchName: string;
  cutoff: number;
  family: CollegeFamily;
  /** Present only when a userRank is supplied. */
  fit?: number;
  tier?: "safe" | "moderate" | "reach";
};

function collegeFamilyOf(code: string): CollegeFamily {
  return familyOf(code) ?? "other";
}

/** All cut-off records for a given college, sorted by family → cutoff asc.
 *  If `userRank` is provided, each record carries a `fit` (0..1) and a `tier`
 *  computed identically to the predictor. */
export function getCollegeRecords(
  collegeCode: string,
  userRank?: number,
): CollegeRecord[] {
  const out: CollegeRecord[] = [];
  for (const r of data.records) {
    if (r.college !== collegeCode) continue;
    const branchName = branchByCode.get(r.branch) ?? r.branch;
    const family = collegeFamilyOf(r.branch);
    const rec: CollegeRecord = {
      branchCode: r.branch,
      branchName,
      cutoff: r.rank,
      family,
    };
    if (userRank && userRank > 0) {
      const { tier, fit } = tierAndFit(r.rank, userRank);
      rec.tier = tier;
      rec.fit = fit;
    }
    out.push(rec);
  }

  out.sort((a, b) => {
    const fa = COLLEGE_FAMILY_RANK[a.family];
    const fb = COLLEGE_FAMILY_RANK[b.family];
    if (fa !== fb) return fa - fb;
    return a.cutoff - b.cutoff;
  });

  return out;
}

/** Group already-sorted records by family for rendering. */
export function groupCollegeRecords(
  records: CollegeRecord[],
): Array<{ family: CollegeFamily; items: CollegeRecord[] }> {
  const map = new Map<CollegeFamily, CollegeRecord[]>();
  for (const r of records) {
    if (!map.has(r.family)) map.set(r.family, []);
    map.get(r.family)!.push(r);
  }
  const order: CollegeFamily[] = [];
  for (const r of records) if (!order.includes(r.family)) order.push(r.family);
  return order.map((family) => ({ family, items: map.get(family)! }));
}

// re-export familyRank for callers who already deal with predictor matches
export { familyRank };
