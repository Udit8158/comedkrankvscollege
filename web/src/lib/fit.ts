// Shared tier + fit computation used by both the predictor (predict.ts) and the
// per-college view (college-records.ts). Keep this the single source of truth so
// the two surfaces can never drift apart.
//
// ratio = (cutoff - userRank) / cutoff
//   ratio < 0     → "reach"    (rank is above the cutoff, within the reach window)
//   ratio < 0.1   → "moderate"
//   else          → "safe"
// fit = ratio clamped to [0, 1] (1 = very safe, 0 = exactly at cutoff).

export type Tier = "safe" | "moderate" | "reach";

export function tierAndFit(
  cutoff: number,
  userRank: number,
): { tier: Tier; fit: number } {
  const ratio = (cutoff - userRank) / cutoff;
  const tier: Tier = ratio < 0 ? "reach" : ratio < 0.1 ? "moderate" : "safe";
  const fit = Math.max(0, Math.min(1, ratio));
  return { tier, fit };
}
