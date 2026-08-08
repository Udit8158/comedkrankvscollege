/**
 * Step 1 of the sign-in — hand the browser to Google.
 *
 * Two one-time values are minted here and stashed in short-lived cookies so the
 * callback can prove the response it receives belongs to the request that
 * started here:
 *
 *   state     — binds the callback to this browser. Without it, an attacker can
 *               feed a victim a callback URL carrying the attacker's code and
 *               sign the victim into the attacker's account (login CSRF).
 *   verifier  — PKCE. Binds the code to this client, so a code intercepted in
 *               transit or left in a log cannot be redeemed by anyone else.
 *
 * PKCE is arguably belt-and-braces for a confidential client that also sends a
 * secret, but it costs four lines and removes the authorization code from the
 * set of things that are dangerous to leak.
 */

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import {
  STATE_COOKIE,
  VERIFIER_COOKIE,
  RETURN_COOKIE,
  googleCredentials,
  redirectUri,
} from "@/lib/auth/config";
import { randomToken, sessionCookieOptions } from "@/lib/auth/session";

/** Ten minutes — long enough to pick an account and type a password, short
 *  enough that a stale state cookie is never sitting around. */
const HANDSHAKE_MAX_AGE = 60 * 10;

export async function GET(req: Request) {
  let clientId: string;
  try {
    ({ clientId } = googleCredentials());
  } catch (err) {
    // Surfaced as a readable page rather than a Google error screen that says
    // "invalid_client" and nothing about which env var is missing.
    return new Response((err as Error).message, {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const state = randomToken();
  const verifier = randomToken();
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  // Where to land after sign-in. Only a same-site path is honoured — accepting
  // an absolute URL here would turn the sign-in into an open redirect.
  const requested = new URL(req.url).searchParams.get("next") ?? "/dashboard";
  const next =
    requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/dashboard";

  const jar = await cookies();
  const options = sessionCookieOptions(HANDSHAKE_MAX_AGE);
  jar.set(STATE_COOKIE, state, options);
  jar.set(VERIFIER_COOKIE, verifier, options);
  jar.set(RETURN_COOKIE, next, options);

  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", redirectUri(req));
  auth.searchParams.set("response_type", "code");
  // Identity only. No Gmail, Drive or Calendar scope is requested, so a
  // compromised token grants nothing beyond the name and address we already
  // put on the allowlist — and the consent screen says exactly that.
  auth.searchParams.set("scope", "openid email profile");
  auth.searchParams.set("state", state);
  auth.searchParams.set("code_challenge", challenge);
  auth.searchParams.set("code_challenge_method", "S256");
  // `select_account` rather than the default: the counsellor's browser is
  // usually already signed into a personal Gmail, and silently reusing it is
  // how you get "access denied" for an address that is on the list.
  auth.searchParams.set("prompt", "select_account");

  return Response.redirect(auth.toString(), 302);
}
