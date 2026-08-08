"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { LEAD_STATUSES, STATUS_META } from "@/lib/lead-status";
import { PLACEMENT_LABEL } from "@/lib/dash-format";

/**
 * Filters live in the URL, not in component state.
 *
 * Which means a filtered view is a link: "the four no-matches leads from last
 * week" can be pasted into a message, bookmarked, or reloaded without losing
 * it. It also means the page stays a server component that queries exactly
 * what's asked for — no shipping every lead to the browser and hiding most of
 * them, which is both slower and a data-exposure question nobody wants to have
 * to think about.
 */

const DAY_RANGES = [
  { value: "1", label: "24h" },
  { value: "7", label: "7d" },
  { value: "30", label: "30d" },
  { value: "0", label: "All" },
] as const;

export function FilterBar({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const status = params.get("status") ?? "all";
  const placement = params.get("placement") ?? "all";
  const days = params.get("days") ?? "0";
  const q = params.get("q") ?? "";

  // Local mirror so typing stays responsive while the debounced navigation
  // catches up. It has to re-sync when the URL changes underneath us — the back
  // button, or the "clear filters" link below — which is React's documented
  // "adjust state during render" pattern rather than an effect. An effect here
  // would render the stale value first and then immediately render again.
  const [search, setSearch] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) {
    setLastQ(q);
    setSearch(q);
  }

  function apply(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === "all" || (key === "days" && value === "0")) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    // Any filter change invalidates the current page number.
    next.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  // 300ms after the last keystroke. Short enough to feel immediate, long enough
  // that a ten-digit phone number is one query rather than ten.
  useEffect(() => {
    if (search === q) return;
    const timer = setTimeout(() => apply({ q: search }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered =
    status !== "all" || placement !== "all" || days !== "0" || q !== "";

  return (
    <div className="rule mt-10 pt-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
        {/* Status — the control that gets used most, so it is buttons rather
            than a menu: one tap, and the current view is readable without
            opening anything. */}
        <div className="flex items-center gap-1">
          <Pill
            active={status === "all"}
            onClick={() => apply({ status: "all" })}
          >
            All
          </Pill>
          {LEAD_STATUSES.map((s) => (
            <Pill
              key={s}
              active={status === s}
              onClick={() => apply({ status: s })}
            >
              {STATUS_META[s].label}
            </Pill>
          ))}
        </div>

        <span aria-hidden className="hidden h-4 w-px bg-hairline sm:block" />

        <div className="flex items-center gap-1">
          {DAY_RANGES.map((r) => (
            <Pill
              key={r.value}
              active={days === r.value}
              onClick={() => apply({ days: r.value })}
            >
              {r.label}
            </Pill>
          ))}
        </div>

        <span aria-hidden className="hidden h-4 w-px bg-hairline sm:block" />

        <label className="flex items-center gap-2">
          <span className="sr-only">Filter by source</span>
          <select
            value={placement}
            onChange={(e) => apply({ placement: e.target.value })}
            className="dash-select"
          >
            <option value="all">Any source</option>
            {Object.entries(PLACEMENT_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[11rem] flex-1 items-center gap-2 border-b border-hairline focus-within:border-[color:var(--accent)]">
          <span className="sr-only">Search leads</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="number, college, note…"
            className="dash-input"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p
          className="font-mono text-[11px] tracking-wider text-fg-dim"
          aria-live="polite"
        >
          {pending ? "…" : `${total} lead${total === 1 ? "" : "s"}`}
          {filtered && !pending && (
            <>
              {" · "}
              <button
                type="button"
                onClick={() =>
                  apply({ status: "all", placement: "all", days: "0", q: "" })
                }
                className="linkmark cursor-pointer"
              >
                clear filters
              </button>
            </>
          )}
        </p>

        {/* Export carries the current filters, so what you download is what you
            are looking at. A CSV that silently ignores the filter bar is the
            fastest way to make someone distrust both. */}
        <a
          href={`/api/dashboard/export?${params.toString()}`}
          className="cta-quiet whitespace-nowrap"
        >
          Export CSV ↓
        </a>
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`dash-pill ${active ? "is-active" : ""}`}
    >
      {children}
    </button>
  );
}
