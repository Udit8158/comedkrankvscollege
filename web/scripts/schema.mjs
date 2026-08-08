/**
 * The dashboard schema, as an ordered list of statements.
 *
 * Every statement is idempotent (IF NOT EXISTS), so applying this to a live
 * database is safe and is how a new column gets added. There is no down
 * migration and no version table: the schema is two tables, and a project this
 * size is better served by a list you can read in one screen than by a
 * migration framework nobody remembers the commands for.
 *
 * Exported rather than inlined into the migration script so the same statements
 * can be applied by a test against a throwaway Postgres — a schema that is only
 * ever exercised by running it against production is a schema nobody has
 * checked.
 */
export const STATEMENTS = [
  // ── leads ──────────────────────────────────────────────────────────────
  // One row per captured number. The context columns (rank, placement,
  // college, match_count) are what make a callback open on the right subject
  // instead of "hi, you enquired?" — they are captured at submit time and
  // never edited afterwards.
  `CREATE TABLE IF NOT EXISTS leads (
     id            uuid PRIMARY KEY,
     created_at    timestamptz NOT NULL DEFAULT now(),
     phone         text        NOT NULL,
     rank          integer     NOT NULL DEFAULT 0,
     placement     text        NOT NULL,
     college_code  text,
     college_name  text,
     match_count   integer,
     path          text,
     -- Follow-up state. Owned by the dashboard, not the capture form.
     status        text        NOT NULL DEFAULT 'new',
     note          text,
     updated_at    timestamptz NOT NULL DEFAULT now(),
     -- Rate-limit key. A salted hash, never a raw IP: this is a minors-heavy
     -- audience and the address has no use beyond throttling abuse.
     ip_hash       text
   )`,

  // The dashboard's default view is "newest first", and every filtered view
  // still sorts by this. Worth the index from row one.
  `CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC)`,
  // Counsellors look a number up when a student calls back.
  `CREATE INDEX IF NOT EXISTS leads_phone_idx ON leads (phone)`,
  // The status filter is the most-used control on the page.
  `CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status)`,
  // Rate limiting reads (ip_hash, created_at) on every POST.
  `CREATE INDEX IF NOT EXISTS leads_ip_window_idx ON leads (ip_hash, created_at DESC)`,

  // ── dashboard_users ────────────────────────────────────────────────────
  // Not an auth table — Google is the identity provider and the allowlist is
  // the gate. This only records who has actually signed in, so the dashboard
  // can attribute a status change to a person and so revoking access is a
  // question you can answer by looking rather than guessing.
  `CREATE TABLE IF NOT EXISTS dashboard_users (
     email         text PRIMARY KEY,
     name          text,
     picture       text,
     first_seen    timestamptz NOT NULL DEFAULT now(),
     last_seen     timestamptz NOT NULL DEFAULT now(),
     sign_in_count integer     NOT NULL DEFAULT 0
   )`,

  // Who last touched a lead's follow-up state. Nullable because every row
  // predating a counsellor's first edit has no owner.
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_by text`,
];
