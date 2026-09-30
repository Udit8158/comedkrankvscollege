import { FitBar } from "@/components/FitBar";
import { SectionHead } from "@/components/SectionHead";
import { formatRank } from "@/lib/utils";
import {
  COLLEGE_FAMILY_LABEL,
  groupCollegeRecords,
  type CollegeRecord,
} from "@/lib/college-records";

export function CollegeCutoffTable({
  records,
  rank,
}: {
  records: CollegeRecord[];
  /** The rank the fit bars and tiers are measured against, if one was given. */
  rank?: number;
}) {
  const hasRank = typeof rank === "number" && rank > 0;
  if (records.length === 0) {
    return (
      <section className="mt-20">
        <div className="flex items-baseline justify-between border-b border-hairline pb-3">
          <span className="eyebrow">cut-offs · round 3 2026</span>
        </div>
        <p className="mt-5 display-italic text-[18px] text-fg-mute max-w-lg">
          No Round 3 2026 cut-offs recorded for this college. Branches may have
          filled in earlier rounds.
        </p>
      </section>
    );
  }

  const groups = groupCollegeRecords(records);

  return (
    <section className="mt-20">
      <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-3">
        {/* Naming the rank here rather than in the nav: it is the line directly
            above the safe/moderate/reach badges, and those badges mean nothing
            without knowing what they were measured against. */}
        <span className="eyebrow">
          cut-offs · round 3 2026
          {hasRank && (
            <span className="text-fg-dim"> · against rank {formatRank(rank)}</span>
          )}
        </span>
        <span className="font-mono text-[12px] text-fg-mute tabular-nums whitespace-nowrap">
          {records.length} {records.length === 1 ? "branch" : "branches"}
        </span>
      </div>

      {groups.map((g) => (
        <div key={g.family}>
          <SectionHead
            label={COLLEGE_FAMILY_LABEL[g.family]}
            count={g.items.length}
          />
          <div>
            {g.items.map((r) => (
              <CutoffRow key={r.branchCode} r={r} hasRank={hasRank} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function CutoffRow({ r, hasRank }: { r: CollegeRecord; hasRank: boolean }) {
  return (
    <div className="row block py-4 sm:grid sm:grid-cols-[1fr_auto] sm:gap-x-5">
      <div className="min-w-0">
        <div className="text-[15px] leading-snug text-fg">{r.branchName}</div>
        <div className="font-mono text-[11px] text-fg-dim tracking-wider mt-0.5">
          ({r.branchCode})
        </div>
      </div>

      <div className="mt-3 sm:mt-0 flex items-center justify-between sm:block sm:text-right tabular-nums">
        <span className="font-mono text-[15px] text-fg">
          {formatRank(r.cutoff)}
        </span>
        {hasRank && r.fit !== undefined && r.tier && (
          <span className="flex items-center gap-3 sm:mt-1 sm:justify-end">
            <FitBar fit={r.fit} tier={r.tier} />
            <span className={`tier ${r.tier}`}>{r.tier}</span>
          </span>
        )}
      </div>
    </div>
  );
}
