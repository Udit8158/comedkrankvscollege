"use client";

import { REGIONS, type Region } from "@/lib/locations";
import { cn } from "@/lib/utils";

/**
 * Where-do-you-want-to-study filter.
 *
 * Two rows, the second revealed by the first: regions, then the areas inside
 * the chosen one. What an "area" is depends on the region — cities everywhere
 * else, sides of the city in Bengaluru, where 59 of 64 colleges share one city
 * name and the real question is north or south. See lib/locations.ts.
 *
 * There is no "All" chip on the second row. The region chip on the first row is
 * already the whole region, and lit; repeating it below as "All" makes three
 * chips for two states. The way back out appears only once there is something
 * to back out of.
 *
 * Every chip carries the number of colleges within reach *at the current rank*,
 * and a chip with none is shown greyed rather than removed. "Nothing in Udupi
 * for you" is an answer; a chip that quietly disappears as you type is not.
 */
export function LocationFilter({
  regionId,
  areaSlug,
  onChange,
  reachable,
}: {
  regionId: string | null;
  areaSlug: string | null;
  onChange: (regionId: string | null, areaSlug: string | null) => void;
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
        aria-label="Filter results by region"
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
            // Pressing the lit region chip widens: back to the whole region if
            // an area is selected, otherwise all the way out. So the chip you
            // came in on is also the way back, one level at a time.
            onClick={() =>
              onChange(
                active?.id === r.id && !areaSlug ? null : r.id,
                null,
              )
            }
          />
        ))}
      </div>

      {active && active.areas.length > 1 && (
        <AreaRow
          region={active}
          areaSlug={areaSlug}
          countIn={countIn}
          onChange={onChange}
        />
      )}
    </div>
  );
}

function AreaRow({
  region,
  areaSlug,
  countIn,
  onChange,
}: {
  region: Region;
  areaSlug: string | null;
  countIn: (codes: readonly string[]) => number;
  onChange: (regionId: string | null, areaSlug: string | null) => void;
}) {
  return (
    <div
      // Keyed on the region so switching regions replays the reveal rather
      // than swapping the labels in place.
      key={region.id}
      className="section-panel mt-3 ml-1 border-l border-hairline pl-4 flex flex-wrap items-center gap-x-1.5 gap-y-1.5"
      role="group"
      aria-label={`Narrow down within ${region.label}`}
    >
      <span className="eyebrow text-fg-dim mr-1">narrow to</span>
      {region.areas.map((a) => (
        <Chip
          key={a.slug}
          label={a.label}
          count={countIn(a.codes)}
          active={areaSlug === a.slug}
          onClick={() => onChange(region.id, areaSlug === a.slug ? null : a.slug)}
        />
      ))}
      {areaSlug && (
        // Only rendered while narrowed — a permanent "All" would be a control
        // for a state you are already in.
        <button
          type="button"
          onClick={() => onChange(region.id, null)}
          className="cta-quiet ml-1"
        >
          ← all of {region.label}
        </button>
      )}
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
