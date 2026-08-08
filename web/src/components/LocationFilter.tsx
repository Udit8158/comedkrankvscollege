"use client";

import { REGIONS, type Region } from "@/lib/locations";
import { cn } from "@/lib/utils";

/**
 * Where-do-you-want-to-study filter.
 *
 * Two tiers, revealed one at a time: six regions on the first row, and the
 * cities inside the chosen region on the second. Flat, it would be thirty-two
 * place names — twenty of them with a single college — which is a wall, not a
 * choice. Regions alone would be too coarse for the student who is only
 * willing to study in Mysuru.
 *
 * Every chip carries the number of colleges within reach *at the current rank*,
 * and a chip with none is shown greyed rather than removed. "Nothing in Bidar
 * for you" is an answer; a chip that quietly disappears as you type is not.
 */
export function LocationFilter({
  regionId,
  citySlug,
  onChange,
  reachable,
}: {
  regionId: string | null;
  citySlug: string | null;
  onChange: (regionId: string | null, citySlug: string | null) => void;
  /** College codes within reach at the current rank — the source of the counts. */
  reachable: ReadonlySet<string>;
}) {
  const active = REGIONS.find((r) => r.id === regionId);
  const countIn = (codes: readonly string[]) =>
    codes.reduce((n, c) => n + (reachable.has(c) ? 1 : 0), 0);

  return (
    <div className="pt-2">
      <div className="flex items-baseline gap-3 pb-4">
        <span className="eyebrow section-label">─── where</span>
        <span className="flex-1 h-px bg-hairline translate-y-[-2px]" />
        <span className="font-mono text-[11px] text-fg-dim tracking-wider">
          colleges in reach
        </span>
      </div>

      <div
        role="group"
        aria-label="Filter results by location"
        className="flex flex-wrap gap-x-1.5 gap-y-1.5"
      >
        <Chip
          label="Anywhere"
          count={reachable.size}
          active={!active}
          onClick={() => onChange(null, null)}
        />
        {REGIONS.map((r) => (
          <Chip
            key={r.id}
            label={r.label}
            count={countIn(r.codes)}
            active={active?.id === r.id}
            // Re-pressing the active region clears the filter, so the chip you
            // just used is also the way back out of it.
            onClick={() => onChange(active?.id === r.id ? null : r.id, null)}
          />
        ))}
      </div>

      {active && active.cities.length > 1 && (
        <CityRow
          region={active}
          citySlug={citySlug}
          countIn={countIn}
          onChange={onChange}
        />
      )}
    </div>
  );
}

function CityRow({
  region,
  citySlug,
  countIn,
  onChange,
}: {
  region: Region;
  citySlug: string | null;
  countIn: (codes: readonly string[]) => number;
  onChange: (regionId: string | null, citySlug: string | null) => void;
}) {
  return (
    <div
      // Keyed on the region so switching regions replays the reveal rather
      // than swapping the labels in place.
      key={region.id}
      className="section-panel mt-3 ml-1 border-l border-hairline pl-4 flex flex-wrap items-center gap-x-1.5 gap-y-1.5"
      role="group"
      aria-label={`Filter by city within ${region.label}`}
    >
      <span className="eyebrow text-fg-dim mr-1">in {region.label}</span>
      <Chip
        label="All"
        count={countIn(region.codes)}
        active={!citySlug}
        onClick={() => onChange(region.id, null)}
      />
      {region.cities.map((c) => (
        <Chip
          key={c.slug}
          label={c.name}
          count={countIn(c.codes)}
          active={citySlug === c.slug}
          onClick={() =>
            onChange(region.id, citySlug === c.slug ? null : c.slug)
          }
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  // A chip with nothing behind it is still readable, just not pressable —
  // unless it is the current selection, which must always be escapable.
  const empty = count === 0 && !active;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={empty}
      aria-pressed={active}
      className={cn("geo-chip", active && "is-active")}
    >
      {label}
      <span className="geo-count">{count}</span>
    </button>
  );
}
