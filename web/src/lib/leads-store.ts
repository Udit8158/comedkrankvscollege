/**
 * Every read and write of the leads table.
 *
 * Kept in one module so the capture endpoint, the dashboard and the CSV export
 * cannot drift on what a lead is — the same reason `leads.ts` owns the wire
 * shape. Nothing here imports React or Next; it is plain data access, which is
 * what lets the migration script and a future notifier reuse it.
 *
 * On SQL construction: the filter builder below assembles a WHERE clause from
 * user-controlled search params. Placeholders (`$1`, `$2`, …) are generated and
 * the values travel separately in the params array — no value is ever
 * interpolated into the query text. The column names and operators are the only
 * thing the code chooses, and those come from closed sets in this file.
 */

import "server-only";
import { db } from "./db";
import { LEAD_STATUSES, type LeadStatus } from "./lead-status";
import type { CtaPlacement } from "./mindcreed";

export type LeadRecord = {
  id: string;
  createdAt: string;
  phone: string;
  rank: number;
  placement: CtaPlacement;
  collegeCode: string | null;
  collegeName: string | null;
  matchCount: number | null;
  path: string | null;
  status: LeadStatus;
  note: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

/** The insert shape — what the capture endpoint has after validation. */
export type NewLead = {
  id: string;
  phone: string;
  rank: number;
  placement: CtaPlacement;
  collegeCode?: string;
  collegeName?: string;
  matchCount?: number;
  path?: string;
  ipHash?: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any -- the driver returns
   untyped rows; every one is narrowed by a mapper immediately below. */

function toRecord(row: any): LeadRecord {
  return {
    id: row.id,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    phone: row.phone,
    rank: row.rank ?? 0,
    placement: row.placement,
    collegeCode: row.college_code,
    collegeName: row.college_name,
    matchCount: row.match_count,
    path: row.path,
    status: row.status,
    note: row.note,
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at),
    updatedBy: row.updated_by ?? null,
  };
}

/* ── Writes ─────────────────────────────────────────────────────────────── */

export async function insertLead(lead: NewLead): Promise<void> {
  const sql = db();
  await sql`
    INSERT INTO leads
      (id, phone, rank, placement, college_code, college_name, match_count, path, ip_hash)
    VALUES
      (${lead.id}, ${lead.phone}, ${lead.rank}, ${lead.placement},
       ${lead.collegeCode ?? null}, ${lead.collegeName ?? null},
       ${lead.matchCount ?? null}, ${lead.path ?? null}, ${lead.ipHash ?? null})
  `;
}

/**
 * How many leads this address has submitted inside the window.
 *
 * The rate limit lives in the database rather than in memory because the
 * capture endpoint runs on serverless functions: an in-process counter is per
 * instance, resets on every cold start, and therefore limits nothing. One extra
 * indexed count per POST is a fair price for a limit that actually holds.
 */
export async function recentLeadCount(
  ipHash: string,
  windowMinutes: number,
): Promise<number> {
  const sql = db();
  const rows = await sql`
    SELECT count(*)::int AS count
      FROM leads
     WHERE ip_hash = ${ipHash}
       AND created_at > now() - make_interval(mins => ${windowMinutes})
  `;
  return rows[0]?.count ?? 0;
}

export async function updateLead(
  id: string,
  patch: { status?: LeadStatus; note?: string | null },
  actor: string,
): Promise<void> {
  const sql = db();

  // COALESCE lets one statement serve both edits: a field left undefined
  // passes NULL and keeps its current value. The note is the exception —
  // clearing it is a real intent, so an empty string is stored as NULL and
  // distinguished from "not editing the note" by the boolean flag.
  const touchesNote = patch.note !== undefined;
  const note = patch.note?.trim() ? patch.note.trim().slice(0, 2000) : null;

  await sql`
    UPDATE leads
       SET status     = COALESCE(${patch.status ?? null}, status),
           note       = CASE WHEN ${touchesNote} THEN ${note} ELSE note END,
           updated_at = now(),
           updated_by = ${actor}
     WHERE id = ${id}
  `;
}

export async function recordSignIn(user: {
  email: string;
  name?: string;
  picture?: string;
}): Promise<void> {
  const sql = db();
  await sql`
    INSERT INTO dashboard_users (email, name, picture, sign_in_count)
    VALUES (${user.email}, ${user.name ?? null}, ${user.picture ?? null}, 1)
    ON CONFLICT (email) DO UPDATE
      SET name          = EXCLUDED.name,
          picture       = EXCLUDED.picture,
          last_seen     = now(),
          sign_in_count = dashboard_users.sign_in_count + 1
  `;
}

/* ── Reads ──────────────────────────────────────────────────────────────── */

export type LeadFilters = {
  status?: LeadStatus | "all";
  placement?: CtaPlacement | "all";
  /** Free text — matched against phone, college name and college code. */
  q?: string;
  /** Days back from now. 0 or undefined means all time. */
  days?: number;
};

/**
 * Neutralise LIKE metacharacters in a user-typed term.
 *
 * Parameterisation stops injection but does nothing about `%` and `_`, which
 * LIKE still reads as wildcards inside the bound value. Without this, a
 * counsellor searching a note for "50%" gets every lead in the database rather
 * than the one they meant — quietly wrong, which is worse than an error.
 * Backslash is Postgres's default LIKE escape, so no ESCAPE clause is needed.
 */
function escapeLike(value: string): string {
  return value.replace(/([\\%_])/g, "\\$1");
}

/** Builds the shared WHERE clause. Returns text plus the ordered params, so
 *  callers can append their own placeholders starting at `params.length + 1`. */
function whereClause(filters: LeadFilters): { text: string; params: any[] } {
  const clauses: string[] = [];
  const params: any[] = [];

  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    clauses.push(`status = $${params.length}`);
  }

  if (filters.placement && filters.placement !== "all") {
    params.push(filters.placement);
    clauses.push(`placement = $${params.length}`);
  }

  if (filters.days && filters.days > 0) {
    params.push(filters.days);
    clauses.push(`created_at > now() - make_interval(days => $${params.length})`);
  }

  if (filters.q?.trim()) {
    // Strip control characters before the term goes anywhere near the driver.
    // A NUL is not a "weird character" Postgres will escape — it rejects the
    // whole statement with 22021 (invalid byte sequence) and the dashboard
    // 500s, so this has to happen here rather than at the query.
    const term = filters.q.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 80);

    if (term) {
      const parts: string[] = [];

      // A phone is searched by digits alone, so "97409 16666" and
      // "+919740916666" both find the same row. When the term carries no
      // digits there is nothing a phone column could match, so the clause is
      // left out entirely rather than handed a pattern picked to match
      // nothing — which is both clearer and one less parameter to bind.
      const digits = term.replace(/\D/g, "");
      if (digits) {
        params.push(`%${digits}%`);
        parts.push(`phone LIKE $${params.length}`);
      }

      params.push(`%${escapeLike(term)}%`);
      const t = params.length;
      parts.push(
        `college_name ILIKE $${t}`,
        `college_code ILIKE $${t}`,
        `note ILIKE $${t}`,
      );

      clauses.push(`(${parts.join(" OR ")})`);
    }
  }

  return {
    text: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

export type LeadPage = {
  rows: LeadRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listLeads(
  filters: LeadFilters,
  page = 1,
  pageSize = 50,
): Promise<LeadPage> {
  const sql = db();
  const { text, params } = whereClause(filters);

  const safePage = Math.max(1, Math.floor(page));
  const offset = (safePage - 1) * pageSize;

  // Count and page fire together. The count does not gate the page — `offset`
  // is derived from the requested page number, not from the total — so making
  // them sequential only ever added one round trip's latency.
  const [countRows, rows] = await Promise.all([
    sql.query(`SELECT count(*)::int AS count FROM leads ${text}`, params),
    sql.query(
      `SELECT * FROM leads ${text}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset],
    ),
  ]);

  const total: number = countRows[0]?.count ?? 0;

  return { rows: rows.map(toRecord), total, page: safePage, pageSize };
}

/** Unpaginated, for the CSV export. Capped so a runaway export cannot hold a
 *  function open until it times out. */
export async function allLeads(
  filters: LeadFilters,
  limit = 5000,
): Promise<LeadRecord[]> {
  const sql = db();
  const { text, params } = whereClause(filters);
  const rows = await sql.query(
    `SELECT * FROM leads ${text} ORDER BY created_at DESC LIMIT $${params.length + 1}`,
    [...params, limit],
  );
  return rows.map(toRecord);
}

export type LeadStats = {
  total: number;
  today: number;
  week: number;
  byStatus: Record<LeadStatus, number>;
  byPlacement: { placement: string; count: number }[];
  /** Leads per day for the last 14 days, oldest first. Drives the sparkline. */
  daily: { day: string; count: number }[];
  /**
   * Postgres's clock at query time, epoch ms. Every "4h ago" on the page is
   * measured against this.
   *
   * It comes from the database rather than from `Date.now()` in the component
   * for two reasons. It is the same clock that stamped `created_at`, so an age
   * can never come out negative because a function's host drifted ahead of the
   * database. And reading a clock during render is an impure call — the page
   * would be recomputing "now" on every re-render, which is exactly the kind of
   * unstable value that makes a server render and its hydration disagree.
   */
  now: number;
};

/**
 * Every headline number, in three queries issued together.
 *
 * The counts collapse into one pass with FILTER rather than one query per
 * bucket. The other two — the placement breakdown and the 14-day series — need
 * different GROUP BYs, so they stay separate, but they are awaited as a group:
 * on the Neon driver every query is its own HTTP request, and three sequential
 * awaits meant three round trips stacked end to end for results that have no
 * dependency on one another.
 *
 * The date arithmetic uses IST rather than UTC — "today" on this dashboard has
 * to mean today in Bengaluru, or the morning's leads appear to belong to
 * yesterday until 05:30.
 */
export async function leadStats(): Promise<LeadStats> {
  const sql = db();

  const totalsQuery = sql`
    SELECT
      now() AS server_now,
      count(*)::int AS total,
      count(*) FILTER (
        WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date
            = (now() AT TIME ZONE 'Asia/Kolkata')::date
      )::int AS today,
      count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS week,
      count(*) FILTER (WHERE status = 'new')::int       AS s_new,
      count(*) FILTER (WHERE status = 'contacted')::int AS s_contacted,
      count(*) FILTER (WHERE status = 'converted')::int AS s_converted,
      count(*) FILTER (WHERE status = 'dropped')::int   AS s_dropped
    FROM leads
  `;

  const byPlacementQuery = sql`
    SELECT placement, count(*)::int AS count
      FROM leads
     GROUP BY placement
     ORDER BY count DESC
  `;

  // generate_series so an empty day is a zero rather than a gap — a sparkline
  // that silently omits quiet days overstates the trend.
  const dailyQuery = sql`
    SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
           count(l.id)::int AS count
      FROM generate_series(
             (now() AT TIME ZONE 'Asia/Kolkata')::date - interval '13 days',
             (now() AT TIME ZONE 'Asia/Kolkata')::date,
             interval '1 day'
           ) AS d(day)
      LEFT JOIN leads l
        ON (l.created_at AT TIME ZONE 'Asia/Kolkata')::date = d.day
     GROUP BY d.day
     ORDER BY d.day
  `;

  // The three fire together rather than one after another. Nothing here depends
  // on anything else here.
  const [totalsRows, byPlacement, daily] = await Promise.all([
    totalsQuery,
    byPlacementQuery,
    dailyQuery,
  ]);
  const totals = totalsRows[0];

  return {
    total: totals?.total ?? 0,
    today: totals?.today ?? 0,
    week: totals?.week ?? 0,
    byStatus: {
      new: totals?.s_new ?? 0,
      contacted: totals?.s_contacted ?? 0,
      converted: totals?.s_converted ?? 0,
      dropped: totals?.s_dropped ?? 0,
    },
    byPlacement: byPlacement.map((r: any) => ({
      placement: r.placement,
      count: r.count,
    })),
    daily: daily.map((r: any) => ({ day: r.day, count: r.count })),
    now: new Date(totals?.server_now ?? Date.now()).getTime(),
  };
}

/** Guard for a status arriving from a form post. */
export function coerceStatus(value: unknown): LeadStatus | undefined {
  return typeof value === "string" &&
    (LEAD_STATUSES as readonly string[]).includes(value)
    ? (value as LeadStatus)
    : undefined;
}
