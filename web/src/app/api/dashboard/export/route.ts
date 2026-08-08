import { getSession } from "@/lib/auth/session";
import { hasDatabase } from "@/lib/db";
import { allLeads, type LeadFilters } from "@/lib/leads-store";
import { isLeadStatus } from "@/lib/lead-status";
import { formatDate, formatTime, placementLabel } from "@/lib/dash-format";
import type { CtaPlacement } from "@/lib/mindcreed";

/**
 * CSV of the current view.
 *
 * Its own auth check, not the dashboard layout's — a route handler is reachable
 * directly by URL, and this one returns every phone number matching the query.
 * Of everything in the app, this is the endpoint that must not be one forgotten
 * guard away from being public.
 *
 * The filters are parsed by the same rules as the page, so the file matches
 * what was on screen when the link was clicked.
 */

const PLACEMENTS: readonly string[] = [
  "header",
  "results",
  "no-matches",
  "college",
  "footer",
];

/**
 * RFC 4180 quoting, plus one defence the RFC does not cover: a field starting
 * with `=`, `+`, `-` or `@` is executed as a formula when the file is opened in
 * Excel or Sheets. Notes are free text typed by counsellors, so that path is
 * live. Prefixing with an apostrophe neutralises it and is invisible in the
 * cell.
 */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/["\n,]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Not signed in.", { status: 401 });
  }
  if (!hasDatabase()) {
    return new Response("No database configured.", { status: 503 });
  }

  const params = new URL(req.url).searchParams;
  const statusParam = params.get("status");
  const placementParam = params.get("placement");
  const days = Number(params.get("days"));

  const filters: LeadFilters = {
    status: isLeadStatus(statusParam) ? statusParam : "all",
    placement: PLACEMENTS.includes(placementParam ?? "")
      ? (placementParam as CtaPlacement)
      : "all",
    days: Number.isFinite(days) && days > 0 ? days : 0,
    q: params.get("q") ?? "",
  };

  const rows = await allLeads(filters);

  const header = [
    "Date",
    "Time (IST)",
    "Phone",
    "Rank",
    "Source",
    "College",
    "College code",
    "Options shown",
    "Status",
    "Note",
    "Last touched by",
    "Page",
  ];

  const body = rows.map((lead) =>
    [
      formatDate(lead.createdAt),
      formatTime(lead.createdAt).replace(" IST", ""),
      // Leading apostrophe keeps the leading digit and stops Sheets rendering
      // a ten-digit number in scientific notation.
      `'${lead.phone}`,
      lead.rank || "",
      placementLabel(lead.placement),
      lead.collegeName ?? "",
      lead.collegeCode ?? "",
      lead.matchCount ?? "",
      lead.status,
      lead.note ?? "",
      lead.updatedBy ?? "",
      lead.path ?? "",
    ]
      .map(cell)
      .join(","),
  );

  // BOM so Excel opens it as UTF-8. College names carry the odd curly
  // apostrophe, and without this they arrive mojibaked.
  const csv = `﻿${[header.map(cell).join(","), ...body].join("\r\n")}\r\n`;

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="mindcreed-leads-${stamp}.csv"`,
      // Never let a proxy or the browser keep a copy of this.
      "cache-control": "no-store, private",
    },
  });
}
