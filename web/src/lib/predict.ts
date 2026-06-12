import raw from "@/data.json";
import { cleanBranchName, familyOf, familyRank, intraFamilyRank, type BranchFamily } from "./branches";

type RawCollege = { code: string; name: string };
type RawBranch = { code: string; name: string };
type RawRecord = { college: string; branch: string; rank: number };

const data = raw as { colleges: RawCollege[]; branches: RawBranch[]; records: RawRecord[] };

const collegeByCode = new Map(data.colleges.map((c) => [c.code, c.name]));
const branchByCode = new Map(data.branches.map((b) => [b.code, cleanBranchName(b.name)]));

export const TOTAL_COLLEGES = data.colleges.length;
export const TOTAL_BRANCHES = data.branches.length;
export const TOTAL_RECORDS = data.records.length;

export type Match = {
  collegeCode: string;
  collegeName: string;
  branchCode: string;
  branchName: string;
  cutoff: number;
  family: BranchFamily;
  /** Headroom = cutoff − userRank. Positive = qualifies. */
  headroom: number;
  /** 0..1: how comfortably the rank fits. 1 = very safe, 0 = exactly at cutoff. */
  fit: number;
  tier: "safe" | "moderate" | "reach";
};

export type PredictOptions = {
  /** Show options where userRank exceeds cutoff by this fraction (e.g. 0.05 = 5%). Reach window. */
  reachMargin?: number;
  /** Hard cap on results PER FAMILY (computing / electronics / core / other). */
  perFamilyLimit?: number;
};

export function predict(userRank: number, opts: PredictOptions = {}): Match[] {
  const { reachMargin = 0.05, perFamilyLimit = 12 } = opts;
  if (!Number.isFinite(userRank) || userRank <= 0) return [];

  const matches: Match[] = [];
  for (const r of data.records) {
    const cutoff = r.rank;
    const headroom = cutoff - userRank;
    // Include qualifies + a small reach window (rank slightly above cutoff).
    if (headroom < -cutoff * reachMargin) continue;

    const collegeName = collegeByCode.get(r.college) ?? r.college;
    const branchName = branchByCode.get(r.branch) ?? r.branch;
    const family = familyOf(r.branch);

    // Fit score: clamp headroom/cutoff to [-reachMargin, 1].
    // Positive → qualifies. Negative within reach window → reach.
    const ratio = headroom / cutoff;
    let tier: Match["tier"];
    if (ratio < 0) tier = "reach";
    else if (ratio < 0.1) tier = "moderate";
    else tier = "safe";

    const fit = Math.max(0, Math.min(1, ratio));

    matches.push({
      collegeCode: r.college,
      collegeName,
      branchCode: r.branch,
      branchName,
      cutoff,
      family,
      headroom,
      fit,
      tier,
    });
  }

  // Sort: family priority asc → intra-family branch priority asc → cutoff asc (best college first)
  matches.sort((a, b) => {
    const fr = familyRank(a.branchCode) - familyRank(b.branchCode);
    if (fr !== 0) return fr;
    const ir = intraFamilyRank(a.branchCode) - intraFamilyRank(b.branchCode);
    if (ir !== 0) return ir;
    return a.cutoff - b.cutoff;
  });

  // Cap PER family so the page doesn't drown a user with 200 rows.
  const perFamilyCount: Record<string, number> = {};
  const capped: Match[] = [];
  for (const m of matches) {
    perFamilyCount[m.family] = (perFamilyCount[m.family] ?? 0) + 1;
    if (perFamilyCount[m.family] <= perFamilyLimit) capped.push(m);
  }
  return capped;
}

export function groupByFamily(matches: Match[]): Array<{ family: BranchFamily; items: Match[] }> {
  const map = new Map<BranchFamily, Match[]>();
  for (const m of matches) {
    if (!map.has(m.family)) map.set(m.family, []);
    map.get(m.family)!.push(m);
  }
  // Maintain family order from the matches array (already sorted)
  const order: BranchFamily[] = [];
  for (const m of matches) if (!order.includes(m.family)) order.push(m.family);
  return order.map((family) => ({ family, items: map.get(family)! }));
}
