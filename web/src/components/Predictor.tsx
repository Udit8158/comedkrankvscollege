"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import {
  groupByFamily,
  predict,
  TOTAL_COLLEGES,
  TOTAL_BRANCHES,
  TOTAL_RECORDS,
} from "@/lib/predict";
import { FAMILY_LABEL } from "@/lib/branches";
import { formatRank } from "@/lib/utils";
import { SectionHead } from "./SectionHead";
import { ResultRow } from "./ResultRow";

export function Predictor() {
  const [rankRaw, setRankRaw] = useState<string>("");
  const deferred = useDeferredValue(rankRaw);
  const resultsRef = useRef<HTMLDivElement>(null);

  // On mobile, the hero + input fills the viewport; pressing the keyboard's
  // Go/Enter key needs to dismiss the keyboard AND surface the results so it
  // doesn't look like nothing happened.
  function handleEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.currentTarget.blur();
    // Wait a tick so the keyboard collapses before we measure & scroll.
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const rank = useMemo(() => {
    const n = parseInt(deferred.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [deferred]);

  const matches = useMemo(() => (rank > 0 ? predict(rank) : []), [rank]);
  const groups = useMemo(() => groupByFamily(matches), [matches]);

  const hasRank = rank > 0;
  const totalMatches = matches.length;

  return (
    <section className="w-full">
      {/* Question */}
      <div className="pt-2">
        <span className="eyebrow">your rank</span>
      </div>
      <h2 className="display text-[32px] sm:text-[44px] md:text-[54px] leading-[1.06] mt-4 max-w-xl">
        Type your rank.{" "}
        <span className="display-italic text-fg-mute">
          The list re-sorts as you go.
        </span>
      </h2>

      {/* Rank input */}
      <div className="rank-shell mt-10 flex items-end gap-4 sm:gap-6 pb-3">
        <label htmlFor="rank" className="eyebrow shrink-0 pb-3">
          rank
        </label>
        <input
          id="rank"
          type="text"
          inputMode="numeric"
          enterKeyHint="go"
          autoComplete="off"
          autoFocus
          spellCheck={false}
          placeholder="000000"
          value={rankRaw}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/[^0-9]/g, "").slice(0, 7);
            setRankRaw(cleaned);
          }}
          onKeyDown={handleEnter}
          className="rank-input text-[52px] sm:text-[72px] md:text-[92px] leading-none pb-1"
          aria-describedby="rank-help"
        />
        {hasRank && (
          <button
            type="button"
            onClick={() => setRankRaw("")}
            className="eyebrow pb-3 hover:text-fg transition-colors"
          >
            clear
          </button>
        )}
      </div>

      <p id="rank-help" className="mt-4 text-[13px] text-fg-mute max-w-xl">
        Indexed against{" "}
        <span className="font-mono text-fg">{TOTAL_COLLEGES}</span> colleges and{" "}
        <span className="font-mono text-fg">{TOTAL_BRANCHES}</span> branches —{" "}
        <span className="font-mono text-fg">{TOTAL_RECORDS}</span> cut-off
        entries from the 2025 Round 3 allotment. General Merit only. Last year
        is a hint, not a promise.
      </p>

      {/* Results */}
      <div ref={resultsRef} className="mt-16 scroll-mt-6">
        {!hasRank && <EmptyState />}

        {hasRank && totalMatches === 0 && <NoMatches rank={rank} />}

        {hasRank && totalMatches > 0 && (
          <>
            <div className="flex items-baseline justify-between border-b border-hairline pb-3">
              <span className="eyebrow">your options</span>
              <span className="font-mono text-[12px] text-fg-mute tabular-nums">
                {formatRank(totalMatches)} found · ranked at{" "}
                <span className="text-fg">{formatRank(rank)}</span>
              </span>
            </div>

            {groups.map((g) => (
              <div key={g.family}>
                <SectionHead
                  label={FAMILY_LABEL[g.family]}
                  count={g.items.length}
                />
                <div>
                  {g.items.map((m) => (
                    <ResultRow key={`${m.collegeCode}-${m.branchCode}`} m={m} />
                  ))}
                </div>
              </div>
            ))}

            <Legend />
          </>
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="border-t border-hairline pt-10">
      <p className="display text-[28px] leading-snug text-fg-mute max-w-md">
        Empty until a rank is entered.{" "}
        <span className="display-italic">No defaults, no sample data.</span>
      </p>
    </div>
  );
}

function NoMatches({ rank }: { rank: number }) {
  return (
    <div className="border-t border-hairline pt-10">
      <p className="display text-[28px] leading-snug max-w-lg">
        Nothing within reach at rank{" "}
        <span className="font-mono">{formatRank(rank)}</span>.
      </p>
      <p className="mt-3 text-[14px] text-fg-mute max-w-md">
        Every 2025 Round 3 cut-off in the dataset closed earlier than this
        number. It does not mean no seat is possible — counselling rounds,
        management quota, and category seats are separate.
      </p>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-16 pt-6 border-t border-hairline flex flex-wrap gap-x-10 gap-y-3 text-[12px]">
      <span className="flex items-center gap-2">
        <span className="tier safe">safe</span>
        <span className="text-fg-mute">easy peasy for you</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="tier moderate">moderate</span>
        <span className="text-fg-mute">gonna be very close</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="tier reach">reach</span>
        <span className="text-fg-mute">most likely you will miss</span>
      </span>
    </div>
  );
}
