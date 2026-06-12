import { FitBar } from "./FitBar";
import { formatRank, splitCollegeName } from "@/lib/utils";
import type { Match } from "@/lib/predict";

export function ResultRow({ m }: { m: Match }) {
  const { title, locality } = splitCollegeName(m.collegeName);
  return (
    <div className="row grid grid-cols-[64px_1fr_auto] gap-x-5 gap-y-1 py-4">
      {/* Left: college code, mono */}
      <div className="font-mono text-[12px] tracking-wider text-fg-mute pt-[3px]">
        {m.collegeCode}
      </div>

      {/* Middle: name + branch */}
      <div className="min-w-0">
        <div className="text-[15px] leading-snug text-fg truncate">
          {title}
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

      {/* Right: rank, fit bar, tier */}
      <div className="text-right tabular-nums">
        <div className="font-mono text-[15px] text-fg">
          {formatRank(m.cutoff)}
        </div>
        <div className="mt-1 flex items-center justify-end gap-3">
          <FitBar fit={m.fit} tier={m.tier} />
          <span className={`tier ${m.tier}`}>{m.tier}</span>
        </div>
      </div>
    </div>
  );
}
