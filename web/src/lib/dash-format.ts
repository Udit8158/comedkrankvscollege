/**
 * Display helpers shared by the dashboard's server and client components.
 *
 * All of it renders in IST regardless of where the browser is, and regardless
 * of whether the code is running on the server or the client. That is not
 * fussiness: dates formatted in the runtime's local zone are the classic
 * hydration mismatch, and a lead that says "22:40" on the server and "17:10"
 * in the browser is worse than useless to someone deciding whether it's too
 * late to call.
 */

import type { CtaPlacement } from "./mindcreed";

const IST = "Asia/Kolkata";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  day: "2-digit",
  month: "short",
});

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "14 Jun" */
export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

/** "18:42 IST" */
export function formatTime(iso: string): string {
  return `${timeFmt.format(new Date(iso))} IST`;
}

/**
 * "4h ago", "3d ago".
 *
 * The column that actually gets read. A counsellor scanning the list is asking
 * "how stale is this?", and an absolute timestamp makes them do the subtraction
 * themselves. The exact time is still there, one hover away.
 *
 * Computed from a caller-supplied `now` so a server render and the client that
 * hydrates it agree on the answer.
 */
export function formatAge(iso: string, now: number): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/** Indian digit grouping — "34,500", the way a rank is written on a result. */
export function formatRank(rank: number): string {
  return rank > 0 ? rank.toLocaleString("en-IN") : "—";
}

/**
 * Where the lead came from, in a counsellor's words rather than the codebase's.
 *
 * `no-matches` is the one worth naming carefully: it means the predictor showed
 * this student nothing at all, which is both the highest-intent lead on the
 * page and the one where the call has to open with something other than "here
 * are your options".
 */
export const PLACEMENT_LABEL: Record<CtaPlacement, string> = {
  header: "Header",
  results: "After results",
  "no-matches": "No matches",
  college: "College page",
  footer: "Footer",
};

export const PLACEMENT_HINT: Record<CtaPlacement, string> = {
  header: "Tapped the always-on link in the brand bar.",
  results: "Saw their full list, then asked for help choosing.",
  "no-matches": "The predictor found nothing at their rank. Highest intent.",
  college: "Asked from a specific college's page.",
  footer: "Reached the bottom of the page and asked.",
};

export function placementLabel(placement: string): string {
  return PLACEMENT_LABEL[placement as CtaPlacement] ?? placement;
}
