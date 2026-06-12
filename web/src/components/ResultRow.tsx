import Link from "next/link";
import { FitBar } from "./FitBar";
import { formatRank, splitCollegeName } from "@/lib/utils";
import type { Match } from "@/lib/predict";

export function ResultRow({ m, rank }: { m: Match; rank: number }) {
  const { title, locality } = splitCollegeName(m.collegeName);
  const href = `/college/${m.collegeCode}?rank=${rank}`;

  return (
    <Link
      href={href}
      className="row block py-4 sm:grid sm:grid-cols-[64px_1fr_auto] sm:gap-x-5 group"
      aria-label={`${title} — open college details`}
    >
      {/* College code: small mono.
       *  Mobile: sits inline above the name.
       *  Desktop: its own 64px column. */}
      <div className="font-mono text-[11px] sm:text-[12px] tracking-wider text-fg-mute sm:pt-[3px] group-hover:text-accent transition-colors">
        {m.collegeCode}
      </div>

      {/* Name + branch */}
      <div className="min-w-0 mt-1 sm:mt-0">
        <div className="text-[15px] leading-snug text-fg">
          <span className="linkmark">{title}</span>
          {locality && (
            <span className="text-fg-dim font-normal">, {locality}</span>
          )}
        </div>
        <div className="text-[13px] text-fg-mute mt-0.5">
          {m.branchName}{" "}
          <span className="font-mono text-[11px] text-fg-dim tracking-wider">
            ({m.branchCode})
          </span>
        </div>
      </div>

      {/* Cutoff + fit + tier.
       *  Mobile: single row below the name — cutoff on left, fit/tier on right.
       *  Desktop: dedicated right column, cutoff on top, fit/tier underneath. */}
      <div className="mt-3 sm:mt-0 flex items-center justify-between sm:block sm:text-right tabular-nums">
        <span className="font-mono text-[15px] text-fg">
          {formatRank(m.cutoff)}
        </span>
        <span className="flex items-center gap-3 sm:mt-1 sm:justify-end">
          <FitBar fit={m.fit} tier={m.tier} />
          <span className={`tier ${m.tier}`}>{m.tier}</span>
        </span>
      </div>
    </Link>
  );
}
