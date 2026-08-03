/**
 * Lead capture — the contract between the form, the API and (later) the
 * dashboard.
 *
 * Why this exists alongside `mindcreed.ts`: a wa.me tap opens a thread but
 * leaves nothing behind. Nobody can count it, nobody can follow up on the
 * student who opened WhatsApp and then closed it, and there is no record to
 * report back to MindCreed. This module is the countable path — the student
 * leaves a number, and the rank they already typed rides along with it.
 *
 * WhatsApp is not gone: it is offered *after* the number is captured, so the
 * student still gets the instant conversation they came for and the lead is
 * recorded either way.
 *
 * Everything about a lead's shape lives here so the form, the endpoint and the
 * eventual dashboard can never disagree about what a lead is.
 */

import type { CtaPlacement } from "./mindcreed";

/**
 * Reduce anything a student might type to the bare 10-digit subscriber number.
 *
 * Real inputs from a phone keyboard include "+91 97409 16666", "091-97409
 * 16666" and "9740916666". Storing those three as three different leads is how
 * a CRM ends up with duplicate rows for one person, so normalisation happens
 * before validation and before storage — never at the display layer.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // +91 / 91 country code.
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  // Leading 0 — the domestic trunk prefix, still muscle memory for many.
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

/**
 * Indian mobile numbers are ten digits opening with 6–9. Landlines and the
 * various 1xx service codes are not reachable on WhatsApp and cannot receive
 * the follow-up, so they are rejected rather than stored as dead rows.
 */
export function isValidPhone(raw: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizePhone(raw));
}

/** "9740916666" → "97409 16666". Display only; storage stays unformatted. */
export function formatPhone(raw: string): string {
  const n = normalizePhone(raw);
  return n.length === 10 ? `${n.slice(0, 5)} ${n.slice(5)}` : n;
}

/**
 * What gets sent to the server and, eventually, shown as a row in MindCreed's
 * dashboard.
 *
 * The context fields are the entire reason this beats a bare phone number: a
 * counsellor opening the dashboard sees that this student ranked 34,500, saw 87
 * options, and asked from the RVCE page — so the callback opens on the right
 * subject instead of "hi, you enquired?".
 */
export type LeadPayload = {
  /** Normalised 10-digit mobile. The identity of the lead. */
  phone: string;
  /** The rank the student typed into the predictor. 0 when they never did. */
  rank: number;
  /** Which CTA produced this lead — the same taxonomy the analytics uses. */
  placement: CtaPlacement;
  /** Set when the lead came from a college page. */
  collegeCode?: string;
  collegeName?: string;
  /** How many seats the predictor showed them. Signals how stuck they are. */
  matchCount?: number;
  /** Page the form was opened from, for attribution. */
  path?: string;
};

export type LeadResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * POST the lead. The only network call in the app.
 *
 * Errors are returned rather than thrown so the dialog can render a message
 * inline: a student whose submit silently fails is a lead lost twice over, so
 * the failure path has to be visible and has to keep the WhatsApp escape hatch
 * reachable.
 */
export async function submitLead(payload: LeadPayload): Promise<LeadResult> {
  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return {
        ok: false,
        error:
          (body && typeof body.error === "string" && body.error) ||
          "Could not save your number. Please try again.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Network error. Check your connection and try again.",
    };
  }
}
