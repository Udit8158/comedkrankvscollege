#!/usr/bin/env node
/**
 * Apply the dashboard schema to Neon.
 *
 *   node scripts/db-migrate.mjs
 *
 * Idempotent — safe to re-run any time, and re-running is how a new column
 * gets applied. The statements themselves live in `schema.mjs` so they can be
 * exercised by a test as well as by this script.
 *
 * Reads DATABASE_URL from the environment, or from web/.env.local if present,
 * so it works both locally and in CI without a flag.
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { STATEMENTS } from "./schema.mjs";

const here = dirname(fileURLToPath(import.meta.url));

// Minimal .env.local reader — enough for KEY=value and KEY="value", which is
// all a connection string needs. Avoids a dependency for six lines of parsing.
function loadEnvLocal() {
  const path = join(here, "..", ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m) continue;
    const [, key, rawValue] = m;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set.\n" +
      "Put the Neon connection string in web/.env.local or export it, then re-run.",
  );
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

console.log(`Applying ${STATEMENTS.length} statements…`);

for (const [i, statement] of STATEMENTS.entries()) {
  const label = statement.trim().split("\n")[0].slice(0, 72);
  try {
    await sql.query(statement);
    console.log(`  ${String(i + 1).padStart(2)}. ${label}`);
  } catch (err) {
    console.error(`\nFailed on statement ${i + 1}:\n${statement}\n`);
    console.error(err);
    process.exit(1);
  }
}

const [{ count }] = await sql`SELECT count(*)::int AS count FROM leads`;
console.log(`\nSchema is up to date. leads currently holds ${count} row(s).`);
