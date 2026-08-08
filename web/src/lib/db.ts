/**
 * Neon Postgres connection.
 *
 * One lazily-created client for the whole app. Lazy rather than module-scope
 * because `neon()` throws on a missing connection string, and the marketing
 * pages — which are the entire site apart from `/dashboard` — must still build
 * and render on a machine that has never seen DATABASE_URL. A predictor that
 * 500s because the CRM is unconfigured would be the tail wagging the dog.
 *
 * The driver speaks HTTP, not TCP, so there is no pool to manage and no
 * connection to close: each tagged-template call is one request. That is the
 * right shape for serverless functions, which is where this runs.
 *
 * Every query in this codebase goes through the `sql` tagged template, which
 * parameterises interpolations. Never build a query by string concatenation —
 * see `leads-store.ts` for how the dynamic filters stay parameterised.
 */

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

/** True when the app has a database configured. Lets callers degrade rather
 *  than crash — the lead endpoint uses this to fall back to log-only capture. */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function db(): NeonQueryFunction<false, false> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Add the Neon connection string to the environment.",
    );
  }
  if (!client) client = neon(process.env.DATABASE_URL);
  return client;
}
