/**
 * Sign out — clear the session cookie.
 *
 * POST only. A GET sign-out can be triggered by any image tag or prefetch on
 * any page, which is a nuisance rather than a vulnerability, but the fix is one
 * word so there is no reason to wear it.
 */

import { cookies } from "next/headers";
import { SESSION_COOKIE, originFrom } from "@/lib/auth/config";
import { sessionCookieOptions } from "@/lib/auth/session";

export async function POST(req: Request) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return Response.redirect(`${originFrom(req)}/login?signed-out=1`, 303);
}
