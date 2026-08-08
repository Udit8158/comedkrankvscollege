/**
 * Step 2 of the sign-in — redeem the code and decide whether this person gets in.
 *
 * Every failure path here lands back on /login with a `?error=` the page can
 * explain in words. A blank screen or a raw 403 on a sign-in is how you get a
 * phone call instead of a retry.
 */

import { cookies } from "next/headers";
import {
  STATE_COOKIE,
  VERIFIER_COOKIE,
  RETURN_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  googleCredentials,
  isAllowed,
  originFrom,
  redirectUri,
} from "@/lib/auth/config";
import {
  newSession,
  seal,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { recordSignIn } from "@/lib/leads-store";
import { hasDatabase } from "@/lib/db";

type GoogleClaims = {
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
  aud?: string;
  exp?: number;
};

/**
 * Read the id_token's claims.
 *
 * The signature is deliberately not verified, and that is safe *only* because
 * of where this token came from: a direct, server-to-server TLS call to
 * Google's token endpoint in the lines above. Google documents this exact
 * exception. If this function is ever reused on a token that arrived from a
 * browser, a redirect fragment, or any other party, it MUST verify against
 * Google's JWKS first — the claims below would otherwise be attacker-authored.
 */
function readIdToken(idToken: string): GoogleClaims | null {
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function fail(req: Request, error: string) {
  return Response.redirect(`${originFrom(req)}/login?error=${error}`, 302);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();

  // Consume the handshake cookies whatever happens — they are single-use, and
  // a state cookie that survives a failed attempt is a replay window.
  const expectedState = jar.get(STATE_COOKIE)?.value;
  const verifier = jar.get(VERIFIER_COOKIE)?.value;
  const next = jar.get(RETURN_COOKIE)?.value ?? "/dashboard";
  const dead = sessionCookieOptions(0);
  jar.set(STATE_COOKIE, "", dead);
  jar.set(VERIFIER_COOKIE, "", dead);
  jar.set(RETURN_COOKIE, "", dead);

  // The user pressed "Cancel" on Google's consent screen.
  if (url.searchParams.get("error")) return fail(req, "cancelled");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || !verifier || !expectedState) {
    return fail(req, "handshake");
  }
  if (state !== expectedState) return fail(req, "state");

  let clientId: string;
  let clientSecret: string;
  try {
    ({ clientId, clientSecret } = googleCredentials());
  } catch {
    return fail(req, "config");
  }

  let idToken: string | undefined;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri(req),
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      // The body names the real cause — almost always redirect_uri_mismatch,
      // i.e. the URI registered in the Google Console does not match the one
      // this deployment computes. Worth a server log; not worth showing.
      console.error("[auth] token exchange failed", res.status, await res.text());
      return fail(req, "exchange");
    }

    ({ id_token: idToken } = await res.json());
  } catch (err) {
    console.error("[auth] token exchange threw", err);
    return fail(req, "exchange");
  }

  const claims = idToken ? readIdToken(idToken) : null;
  if (!claims?.email) return fail(req, "exchange");

  // Belt-and-braces on a token we already trust by provenance: confirm it was
  // minted for this client and has not expired.
  if (claims.aud !== clientId) return fail(req, "exchange");
  if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) {
    return fail(req, "exchange");
  }

  // An unverified address can be claimed by someone who does not control it,
  // which would let an allowlisted address be impersonated.
  const verified =
    claims.email_verified === true || claims.email_verified === "true";
  if (!verified) return fail(req, "unverified");

  // The gate.
  if (!isAllowed(claims.email)) return fail(req, "denied");

  const session = newSession({
    email: claims.email,
    name: claims.name,
    picture: claims.picture,
  });

  jar.set(SESSION_COOKIE, seal(session), sessionCookieOptions(SESSION_MAX_AGE));

  // Best-effort audit. A database hiccup must not block a valid sign-in — the
  // allowlist, not this table, is what grants access.
  if (hasDatabase()) {
    try {
      await recordSignIn(session);
    } catch (err) {
      console.error("[auth] could not record sign-in", err);
    }
  }

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return Response.redirect(`${originFrom(req)}${safeNext}`, 302);
}
