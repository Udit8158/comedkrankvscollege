import { isValidPhone, normalizePhone } from "@/lib/leads";
import type { CtaPlacement } from "@/lib/mindcreed";

/**
 * Lead intake.
 *
 * ⚠️  THIS DOES NOT PERSIST YET. It validates the lead and writes it to the
 * function log, nothing more. Vercel's runtime logs are short-retention and not
 * queryable as a record set, so a lead that arrives here and is not also
 * followed up on WhatsApp is effectively lost. That is why the dialog still
 * offers the WhatsApp handoff on success — until a store is wired in, the
 * conversation is the only durable copy.
 *
 * The shape below is the contract the dashboard will read. To make it real,
 * replace the single `console.info` with an insert and keep everything else:
 * validation, normalisation and the record shape are all storage-agnostic.
 *
 *   const lead = { ...same object... };
 *   await db.insert(leads).values(lead);   // or Neon / Upstash / Sheets
 *
 * Still owed before this is production lead capture:
 *   - persistence (above)
 *   - rate limiting — this endpoint is open and unauthenticated today
 *   - a notification to MindCreed so a lead doesn't wait on a dashboard visit
 */

/** Placements the client is allowed to claim. Guards the dashboard's grouping
 *  from arbitrary strings posted by anyone who finds the endpoint. */
const PLACEMENTS: readonly CtaPlacement[] = [
  "header",
  "results",
  "no-matches",
  "college",
  "footer",
];

function bad(error: string, status = 400) {
  return Response.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("Malformed request.");
  }

  if (typeof body !== "object" || body === null) {
    return bad("Malformed request.");
  }

  const raw = body as Record<string, unknown>;

  // Never trust the client's validation — it exists to give fast feedback, not
  // to keep junk out of the dataset.
  const phoneInput = typeof raw.phone === "string" ? raw.phone : "";
  if (!isValidPhone(phoneInput)) {
    return bad("Enter a valid 10-digit Indian mobile number.");
  }

  const rankInput = Number(raw.rank);
  const rank =
    Number.isFinite(rankInput) && rankInput > 0 ? Math.floor(rankInput) : 0;

  const placementInput = raw.placement as CtaPlacement;
  const placement = PLACEMENTS.includes(placementInput)
    ? placementInput
    : "results";

  const str = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;

  const matchCountInput = Number(raw.matchCount);

  const lead = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    phone: normalizePhone(phoneInput),
    rank,
    placement,
    collegeCode: str(raw.collegeCode, 12),
    collegeName: str(raw.collegeName, 160),
    matchCount: Number.isFinite(matchCountInput)
      ? Math.max(0, Math.floor(matchCountInput))
      : undefined,
    path: str(raw.path, 200),
  };

  // The stand-in for storage. Structured on one line so it can be grepped out
  // of the Vercel log drain and replayed once a real store exists.
  console.info("[lead]", JSON.stringify(lead));

  return Response.json({ ok: true });
}
