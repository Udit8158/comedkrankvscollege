import { createHash } from "node:crypto";
import { isValidPhone, normalizePhone } from "@/lib/leads";
import { hasDatabase } from "@/lib/db";
import { insertLead, recentLeadCount } from "@/lib/leads-store";
import type { CtaPlacement } from "@/lib/mindcreed";

/**
 * Lead intake.
 *
 * Persists to Neon Postgres and is read back by the dashboard at /dashboard.
 * The `console.info("[lead]", …)` line is kept alongside the insert on purpose:
 * it costs nothing, and it means a lead is still recoverable from the function
 * log on the day the database is unreachable — which is exactly the day it
 * matters. If the insert fails, the request still returns ok, because a student
 * seeing "could not save your number" over an infrastructure problem loses the
 * lead twice: once in the database and once in their willingness to retry.
 *
 * Still owed:
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

/**
 * Rate limit: at most 6 submissions from one address per hour.
 *
 * Sized against real behaviour rather than an abstract threshold. A student
 * legitimately submits once, twice if they mistyped; a household or a school
 * computer lab behind one NAT might produce four or five in an afternoon. Six
 * leaves room for all of that and still stops a script from filling the table.
 */
const RATE_LIMIT = 6;
const RATE_WINDOW_MINUTES = 60;

/**
 * A salted hash of the caller's IP — never the address itself.
 *
 * The audience is largely minors, and the address has exactly one use here:
 * telling two submissions apart. A hash serves that and nothing else, so a
 * database leak cannot be turned into a list of locations. AUTH_SECRET is
 * reused as the salt so there is no second secret to rotate; a per-deploy salt
 * would reset the limiter on every deploy, which is the wrong trade.
 */
function ipHash(req: Request): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    undefined;
  if (!ip) return undefined;
  const salt = process.env.AUTH_SECRET ?? "mindcreed";
  return createHash("sha256").update(`${salt}:${ip}`).digest("base64url");
}

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

  // Kept as the log-drain fallback. One line, greppable, replayable.
  console.info("[lead]", JSON.stringify(lead));

  if (!hasDatabase()) {
    // No store configured — the log line above is the record, same as before.
    console.warn("[lead] DATABASE_URL unset; lead captured to log only");
    return Response.json({ ok: true });
  }

  const hash = ipHash(req);

  try {
    if (hash) {
      const recent = await recentLeadCount(hash, RATE_WINDOW_MINUTES);
      if (recent >= RATE_LIMIT) {
        // Deliberately worded as a state, not an accusation: the overwhelming
        // majority of anyone who sees this is a real student on a shared
        // connection, and the WhatsApp route is still open to them.
        return bad(
          "We've already got a few requests from this connection. Message us on WhatsApp and we'll pick it up there.",
          429,
        );
      }
    }

    await insertLead({ ...lead, ipHash: hash });
  } catch (err) {
    // Logged loudly, hidden from the student. The console line above means the
    // lead is not lost, so failing the request would only cost a conversion.
    console.error("[lead] insert failed", err);
  }

  return Response.json({ ok: true });
}
