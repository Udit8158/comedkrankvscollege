import raw from "@/data.json";
import { cleanBranchName, familyOf, familyRank, intraFamilyRank, type BranchFamily } from "./branches";
import { getCollege, listColleges } from "./colleges";
import { tierAndFit } from "./fit";

type RawBranch = { code: string; name: string };
type RawRecord = { college: string; branch: string; rank: number };

const data = raw as { branches: RawBranch[]; records: RawRecord[] };

const branchByCode = new Map(data.branches.map((b) => [b.code, cleanBranchName(b.name)]));

export const TOTAL_COLLEGES = listColleges().length;
/**
 * Colleges that actually appear in the cut-off records (⊂ all colleges). The
 * rest are in colleges.ts for the metadata but had no Round 3 GM allotment, so
 * no rank can ever surface them — which is why the location filter builds its
 * buckets from this set rather than from every college.
 */
export const COLLEGE_CODES_WITH_RECORDS: ReadonlySet<string> = new Set(
  data.records.map((r) => r.college),
);
export const TOTAL_COLLEGES_WITH_RECORDS = COLLEGE_CODES_WITH_RECORDS.size;
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
  /** Hard cap on results per family. Overrides DEFAULT_FAMILY_LIMITS. */
  familyLimits?: Partial<Record<BranchFamily, number>>;
  /**
   * Restrict to these college codes (the location filter). `null`/absent means
   * anywhere. This has to be applied *inside* predict rather than by filtering
   * the returned array, because the per-family caps below run after it — the
   * five best CSE seats in Karnataka are all in Bengaluru, so post-filtering
   * "Mysuru" against a capped list would show nothing at all.
   */
  collegeCodes?: ReadonlySet<string> | null;
};

const DEFAULT_FAMILY_LIMITS: Record<BranchFamily, number> = {
  cse: 5,           // top 5 best pure-CS colleges
  cse_spec: 10,     // top 10 best CSE specialization seats
  electronics: 5,   // top 5 best electronics seats
  core: 10,         // top 10 best core engineering seats — depth at top colleges
                    // (core has more branch diversity per college: ME, CV, CH,
                    //  IM, BT, AS, etc. — 5 was too tight to show that depth)
};

export function predict(userRank: number, opts: PredictOptions = {}): Match[] {
  const { reachMargin = 0.05, familyLimits, collegeCodes } = opts;
  const limits = { ...DEFAULT_FAMILY_LIMITS, ...(familyLimits ?? {}) };
  if (!Number.isFinite(userRank) || userRank <= 0) return [];

  const matches: Match[] = [];
  for (const r of data.records) {
    if (collegeCodes && !collegeCodes.has(r.college)) continue;
    const cutoff = r.rank;
    const headroom = cutoff - userRank;
    // Include qualifies + a small reach window (rank slightly above cutoff).
    if (headroom < -cutoff * reachMargin) continue;

    const family = familyOf(r.branch);
    if (family === null) continue; // skip design / planning branches

    const college = getCollege(r.college);
    const collegeName = college
      ? [college.name, [college.locality, college.city].filter(Boolean).join(", ")]
          .filter(Boolean)
          .join("-")
      : r.college;
    const branchName = branchByCode.get(r.branch) ?? r.branch;

    // Tier + fit: shared with the per-college view via tierAndFit().
    const { tier, fit } = tierAndFit(cutoff, userRank);

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

  // Sort: family priority asc → cutoff asc (best college first within family).
  // Intra-family rank is a tie-breaker for ties on cutoff.
  matches.sort((a, b) => {
    const fr = familyRank(a.branchCode) - familyRank(b.branchCode);
    if (fr !== 0) return fr;
    if (a.cutoff !== b.cutoff) return a.cutoff - b.cutoff;
    return intraFamilyRank(a.branchCode) - intraFamilyRank(b.branchCode);
  });

  // Per-family cap: e.g. 5 best CSE, 10 best CSE specializations, 5 best EC,
  // 5 best core, 3 best other.
  const perFamilyCount: Record<string, number> = {};
  const capped: Match[] = [];
  for (const m of matches) {
    perFamilyCount[m.family] = (perFamilyCount[m.family] ?? 0) + 1;
    if (perFamilyCount[m.family] <= limits[m.family]) capped.push(m);
  }
  return capped;
}

/**
 * Every college with at least one branch within reach at this rank — uncapped
 * and unfiltered.
 *
 * This is what the location chips count. Counting matches instead would mean
 * counting a capped, per-family number, so a region would read "10" purely
 * because that is where the cap sits; and counting them per region would mean
 * running the whole prediction once per chip. A college count is also the
 * honest unit for the question the chips answer, which is "is there anything
 * for me there", not "how many rows will I see".
 */
export function reachableCollegeCodes(
  userRank: number,
  reachMargin = 0.05,
): ReadonlySet<string> {
  const codes = new Set<string>();
  if (!Number.isFinite(userRank) || userRank <= 0) return codes;
  for (const r of data.records) {
    if (codes.has(r.college)) continue;
    if (r.rank - userRank < -r.rank * reachMargin) continue;
    if (familyOf(r.branch) === null) continue;
    codes.add(r.college);
  }
  return codes;
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
