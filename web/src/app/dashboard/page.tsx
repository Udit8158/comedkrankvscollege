import { hasDatabase } from "@/lib/db";
import { leadStats, listLeads, type LeadFilters } from "@/lib/leads-store";
import { isLeadStatus } from "@/lib/lead-status";
import { StatStrip } from "@/components/dashboard/StatStrip";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { LeadRow } from "@/components/dashboard/LeadRow";
import { Pagination } from "@/components/dashboard/Pagination";
import { SetupNotice } from "@/components/dashboard/SetupNotice";
import type { CtaPlacement } from "@/lib/mindcreed";

const PAGE_SIZE = 50;

const PLACEMENTS: readonly string[] = [
  "header",
  "results",
  "no-matches",
  "college",
  "footer",
];

/**
 * The leads list.
 *
 * A server component that queries exactly the filtered page it renders. The
 * alternative — fetch everything, filter in the browser — would put every
 * student's phone number into the client bundle on first load, including the
 * ones the current view is explicitly excluding. Filters live in the URL (see
 * FilterBar) precisely so this can stay server-side.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!hasDatabase()) return <SetupNotice />;

  const params = await searchParams;
  const one = (key: string): string | undefined => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  // Everything below is attacker-controllable, so each is narrowed to a known
  // set or a number before it reaches the query builder.
  const statusParam = one("status");
  const placementParam = one("placement");
  const daysParam = Number(one("days"));
  const pageParam = Number(one("page"));

  const filters: LeadFilters = {
    status: isLeadStatus(statusParam) ? statusParam : "all",
    placement: PLACEMENTS.includes(placementParam ?? "")
      ? (placementParam as CtaPlacement)
      : "all",
    days: Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 0,
    q: one("q") ?? "",
  };

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  // Both queries at once — they are independent, and the stats query is the
  // slower of the two.
  const [stats, result] = await Promise.all([
    leadStats(),
    listLeads(filters, page, PAGE_SIZE),
  ]);

  // One timestamp for every "4h ago" on the page — Postgres's clock, taken in
  // the same round trip as the counts, and handed down so server render and
  // hydration cannot disagree. See LeadStats.now for why it isn't Date.now().
  const now = stats.now;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8">
      <h1 className="display text-[30px] leading-[1.14] sm:text-[36px]">
        Callback requests
      </h1>
      <p className="mt-3 max-w-[52ch] text-[14px] leading-relaxed text-fg-mute">
        Every number left on the rank tool, newest first, with the rank and the
        page it came from. Tap a number to call it, or the glyph to open
        WhatsApp.
      </p>

      <div className="mt-10">
        <StatStrip stats={stats} />
      </div>

      <FilterBar total={result.total} />

      {result.rows.length === 0 ? (
        <EmptyState hasAnyLeads={stats.total > 0} />
      ) : (
        <>
          <ul className="mt-2">
            {result.rows.map((lead) => (
              <LeadRow key={lead.id} lead={lead} now={now} />
            ))}
          </ul>
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
          />
        </>
      )}
    </div>
  );
}

/**
 * Two different empty states, because they mean opposite things. No leads at
 * all is a state of the world; no leads matching is a state of the filter bar,
 * and conflating them sends someone to check whether the form is broken.
 */
function EmptyState({ hasAnyLeads }: { hasAnyLeads: boolean }) {
  return (
    <div className="rule mt-6 py-20 text-center">
      <p className="eyebrow">{hasAnyLeads ? "no matches" : "nothing yet"}</p>
      <p className="mx-auto mt-4 max-w-[40ch] text-[14px] leading-relaxed text-fg-mute">
        {hasAnyLeads
          ? "No leads match these filters. Widen the date range or clear the search."
          : "No callback requests have come in yet. They appear here the moment a student leaves a number on the rank tool."}
      </p>
    </div>
  );
}
