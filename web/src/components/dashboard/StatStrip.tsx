import type { LeadStats } from "@/lib/leads-store";
import { placementLabel } from "@/lib/dash-format";

/**
 * The four numbers worth putting above the list, plus a fortnight of shape.
 *
 * "Waiting" comes last but is the one that should change behaviour — it is the
 * count of leads nobody has touched, which is the only figure here that is a
 * task rather than a fact. It carries the accent when it is non-zero and goes
 * quiet at zero, so an empty queue reads as calm rather than as a fifth
 * statistic competing for attention.
 *
 * No cards, no borders per tile. The app's vocabulary is hairlines and mono
 * labels; four boxes with shadows would be the first thing on the page that
 * looks bought rather than built.
 */
export function StatStrip({ stats }: { stats: LeadStats }) {
  const waiting = stats.byStatus.new;

  return (
    <section aria-label="Summary" className="rule pt-6">
      <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
        <Stat label="today" value={stats.today} />
        <Stat label="last 7 days" value={stats.week} />
        <Stat label="all time" value={stats.total} />
        <Stat label="waiting" value={waiting} accent={waiting > 0} />
      </div>

      <div className="mt-9 grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Sparkline daily={stats.daily} />
        <PlacementBreakdown
          byPlacement={stats.byPlacement}
          total={stats.total}
        />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p
        className={`mt-2 font-mono text-[30px] leading-none tabular-nums tracking-tight sm:text-[34px] ${
          accent ? "text-accent" : "text-fg"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Fourteen days as bars.
 *
 * Bars rather than a line: the series is counts of discrete events at daily
 * resolution, and a line between two days implies values in between that don't
 * exist. Every day gets a column even at zero — a one-pixel floor — so a quiet
 * week reads as quiet instead of as missing data.
 */
function Sparkline({ daily }: { daily: LeadStats["daily"] }) {
  const peak = Math.max(1, ...daily.map((d) => d.count));

  return (
    <div>
      <p className="eyebrow">last 14 days</p>
      <div className="mt-3 flex h-[52px] items-end gap-[3px]">
        {daily.map((d) => (
          <div
            key={d.day}
            title={`${d.day} — ${d.count} lead${d.count === 1 ? "" : "s"}`}
            className="min-w-0 flex-1 rounded-[1px]"
            style={{
              // A zero day gets a 3px stub rather than a percentage. At 52px
              // tall a proportional zero is sub-pixel, and a bar that vanishes
              // reads as missing data — the opposite of what it means.
              height: d.count > 0 ? `${Math.max(8, (d.count / peak) * 100)}%` : "3px",
              background:
                d.count > 0 ? "var(--accent-line)" : "var(--hairline-strong)",
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] tracking-wider text-fg-dim">
        <span>{daily[0]?.day.slice(5).replace("-", "/")}</span>
        <span>peak {peak}</span>
        <span>today</span>
      </div>
    </div>
  );
}

/**
 * Which CTA actually produces leads. The reason `placement` is stored at all:
 * it turns "should the no-matches CTA be worded differently?" into a question
 * with an answer.
 */
function PlacementBreakdown({
  byPlacement,
  total,
}: {
  byPlacement: LeadStats["byPlacement"];
  total: number;
}) {
  if (total === 0) return null;

  return (
    <div className="sm:min-w-[13rem]">
      <p className="eyebrow">source</p>
      <dl className="mt-3 space-y-1.5">
        {byPlacement.slice(0, 5).map((p) => (
          <div key={p.placement} className="flex items-baseline gap-3">
            <dt className="flex-1 truncate text-[12.5px] text-fg-mute">
              {placementLabel(p.placement)}
            </dt>
            <dd className="font-mono text-[12px] tabular-nums text-fg">
              {p.count}
              <span className="ml-1.5 text-fg-dim">
                {Math.round((p.count / total) * 100)}%
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
