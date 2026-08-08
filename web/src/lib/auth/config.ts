/**
 * Dashboard access control.
 *
 * The dashboard holds phone numbers belonging to school-leavers, so the gate is
 * an allowlist rather than a role system: an address either appears in
 * DASHBOARD_ALLOWED_EMAILS or it cannot get in, and no amount of signing in
 * with a valid Google account changes that. Adding a counsellor is an env var
 * edit and a redeploy — which is the right amount of friction for a team of
 * two or three, and deliberately not a self-serve invite flow.
 *
 * Google is the identity provider so no password for this data ever exists in
 * our database to leak, and MindCreed's existing Workspace/Gmail 2FA is
 * inherited for free.
 */

/** Where Google sends the browser back. Registered in the Google Console. */
export const CALLBACK_PATH = "/api/auth/callback/google";

/** Cookie names. Prefixed so they never collide with the theme cookie. */
export const SESSION_COOKIE = "mc_session";
export const STATE_COOKIE = "mc_oauth_state";
export const VERIFIER_COOKIE = "mc_oauth_verifier";
export const RETURN_COOKIE = "mc_oauth_return";

/** Seven days. Long enough that a counsellor is not signing in daily, short
 *  enough that a forgotten laptop stops being a way in within the week. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type AllowedEmails = readonly string[];

/**
 * The allowlist, normalised.
 *
 * Gmail treats dots and `+tags` in the local part as noise, so
 * `u.dit+work@gmail.com` and `udit@gmail.com` are one inbox. Comparing the raw
 * strings would let someone on the list be locked out by how they happened to
 * type it — and, worse, would tempt a future edit to loosen the check. Both
 * sides are canonicalised instead.
 */
export function allowedEmails(): AllowedEmails {
  return (process.env.DASHBOARD_ALLOWED_EMAILS ?? "")
    .split(/[,\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .map(canonicalEmail);
}

/** Lowercase; for Gmail, strip dots and any `+tag` from the local part. */
export function canonicalEmail(raw: string): string {
  const email = raw.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1) return email;

  let local = email.slice(0, at);
  const domain = email.slice(at + 1);

  if (domain === "gmail.com" || domain === "googlemail.com") {
    local = local.split("+")[0].replace(/\./g, "");
    return `${local}@gmail.com`;
  }

  const plus = local.indexOf("+");
  if (plus > 0) local = local.slice(0, plus);
  return `${local}@${domain}`;
}

/** The one check that matters. */
export function isAllowed(email: string): boolean {
  const list = allowedEmails();
  // An empty allowlist denies everyone. Failing closed is the only safe
  // reading of a missing env var on a page that lists students' numbers —
  // the alternative, "unconfigured means open", is how dashboards leak.
  if (list.length === 0) return false;
  return list.includes(canonicalEmail(email));
}

/**
 * The app's own origin, for building the OAuth redirect URI.
 *
 * Preferring the request's forwarded host over a hard-coded URL is what lets
 * this work unchanged on localhost, on a Vercel preview and in production.
 * AUTH_URL overrides it when you need to pin one — which you do the moment a
 * preview deployment must use the single redirect URI registered with Google.
 */
export function originFrom(req: Request): string {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");

  const headers = req.headers;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const proto =
    headers.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") || host?.startsWith("127.0.0.1")
      ? "http"
      : "https");

  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

export function redirectUri(req: Request): string {
  return `${originFrom(req)}${CALLBACK_PATH}`;
}

/** Config the OAuth routes need. Throws loudly rather than redirecting into a
 *  Google error page that says nothing useful. */
export function googleCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set. Create an OAuth client in the Google Cloud Console and add both to the environment.",
    );
  }
  return { clientId, clientSecret };
}
