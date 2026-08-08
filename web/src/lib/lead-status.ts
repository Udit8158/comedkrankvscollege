/**
 * The follow-up pipeline.
 *
 * Four states, deliberately. A counsellor updating a row is doing it between
 * calls on a phone, and every extra state is a decision that slows that down
 * without changing what anyone does next. "Converted" means a student who
 * enrolled through MindCreed; "dropped" covers wrong number, not interested,
 * and never answered — the distinction between those matters to nobody once the
 * lead is closed.
 *
 * Shared by the store, the filter bar, the table and the CSV export so the
 * vocabulary can never fork.
 */

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "converted",
  "dropped",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export function isLeadStatus(value: unknown): value is LeadStatus {
  return (
    typeof value === "string" &&
    (LEAD_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * Display label and the token driving its colour.
 *
 * The scale is about *what to do*, not about how good the outcome was:
 *
 *   new       brass   — act on this
 *   contacted neutral — in flight, nothing owed right now
 *   converted green   — won
 *   dropped   dim     — closed
 *
 * "Contacted" is deliberately neutral rather than the tier palette's amber.
 * Amber next to brass is two warm tones a metre apart on a phone screen, and
 * the one distinction this page exists to make — worked versus unworked — is
 * exactly the one that would blur. Converted reuses the safe green because the
 * app already teaches that colour as "you're fine here".
 */
export const STATUS_META: Record<
  LeadStatus,
  { label: string; tone: "accent" | "safe" | "mute" | "dim" }
> = {
  new: { label: "New", tone: "accent" },
  contacted: { label: "Contacted", tone: "mute" },
  converted: { label: "Converted", tone: "safe" },
  dropped: { label: "Dropped", tone: "dim" },
};
