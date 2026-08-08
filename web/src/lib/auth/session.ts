/**
 * The session cookie — signed, not encrypted.
 *
 * A session here carries nothing secret: an email, a display name, an avatar
 * URL and an expiry. What matters is that none of it can be *forged*, because
 * the email is the authorisation decision. So the payload is readable and the
 * signature is the whole security property — an HMAC over the exact bytes that
 * get sent, verified in constant time.
 *
 * Why not a JWT library: this is a single-issuer, single-audience, symmetric
 * token that never leaves our own domain. The JWT spec's flexibility — `alg`
 * negotiation above all — is a liability at this size, not a feature. Sixty
 * lines of node:crypto has no `alg: none` to get wrong.
 *
 * Node's crypto means these helpers are Node-runtime only. That is why the
 * dashboard guards in the layout and in each route handler rather than in
 * middleware/proxy, which is a separate and more constrained runtime.
 */

import "server-only";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, isAllowed } from "./config";

export type Session = {
  email: string;
  name?: string;
  picture?: string;
  /** Unix seconds. */
  exp: number;
};

function secret(): Buffer {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Generate one with `openssl rand -base64 32` and add it to the environment.",
    );
  }
  return Buffer.from(value, "utf8");
}

const b64url = (buf: Buffer) => buf.toString("base64url");

function sign(payload: string): string {
  return b64url(createHmac("sha256", secret()).update(payload).digest());
}

/** `<base64url(json)>.<base64url(hmac)>` */
export function seal(session: Session): string {
  const payload = b64url(Buffer.from(JSON.stringify(session), "utf8"));
  return `${payload}.${sign(payload)}`;
}

export function unseal(token: string | undefined): Session | null {
  if (!token) return null;

  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;

  const payload = token.slice(0, dot);
  const provided = Buffer.from(token.slice(dot + 1), "base64url");
  const expected = Buffer.from(sign(payload), "base64url");

  // Length check first: timingSafeEqual throws on a mismatch rather than
  // returning false, and a wrong-length signature is a forgery either way.
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(provided, expected)) return null;

  let session: Session;
  try {
    session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof session.email !== "string" || typeof session.exp !== "number") {
    return null;
  }
  if (session.exp * 1000 < Date.now()) return null;

  // The allowlist is re-checked on every read, not just at sign-in. Removing
  // someone from DASHBOARD_ALLOWED_EMAILS must lock them out on their next
  // request — otherwise a revoked counsellor keeps access for up to a week on
  // a cookie that was legitimately issued.
  if (!isAllowed(session.email)) return null;

  return session;
}

/** Read and verify the current session. Null when signed out or tampered. */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return unseal(jar.get(SESSION_COOKIE)?.value);
}

/** Cookie options shared by set and clear so they can never drift — a clear
 *  that misses an attribute leaves the original cookie in place. */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    // Lax, not Strict: the OAuth callback is a cross-site top-level navigation
    // back from accounts.google.com, and Strict would withhold the cookie on
    // exactly that request.
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/** Random URL-safe token, for the OAuth `state` and PKCE verifier. */
export function randomToken(bytes = 32): string {
  return b64url(randomBytes(bytes));
}

export function newSession(user: {
  email: string;
  name?: string;
  picture?: string;
}): Session {
  return {
    email: user.email.toLowerCase(),
    name: user.name,
    picture: user.picture,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
}
