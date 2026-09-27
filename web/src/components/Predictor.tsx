"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  groupByFamily,
  predict,
  reachableCollegeCodes,
} from "@/lib/predict";
import { FAMILY_LABEL, type BranchFamily } from "@/lib/branches";
import { areaBySlug, codesFor, placePhrase, regionById } from "@/lib/locations";
import { formatRank } from "@/lib/utils";
import { SectionHead } from "./SectionHead";
import { ResultRow } from "./ResultRow";
import { LocationFilter } from "./LocationFilter";
import { CounselCTA } from "./CounselCTA";
import { useRank } from "./RankContext";

export function Predictor() {
  // If we came back from a college page (/?rank=12000), pre-fill the input so
  // the user lands exactly where they left off.
  const searchParams = useSearchParams();
  const initialRank = (searchParams.get("rank") ?? "").replace(/\D/g, "").slice(0, 7);
  const [rankRaw, setRankRaw] = useState<string>(initialRank);
  const deferred = useDeferredValue(rankRaw);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Location filter. Seeded from the URL and written back to it (?in=&area=),
  // so a filtered list is a link a student can send to a parent, and so that
  // opening a college and coming back does not silently drop the filter.
  // Validated on read — a hand-typed ?in=goa must fall back to "anywhere".
  const [place, setPlace] = useState<{ region: string | null; area: string | null }>(
    () => {
      const region = regionById(searchParams.get("in"));
      if (!region) return { region: null, area: null };
      const area = areaBySlug(region, searchParams.get("area"));
      return { region: region.id, area: area?.slug ?? null };
    },
  );

  function changePlace(region: string | null, area: string | null) {
    setPlace({ region, area });
    const url = new URL(window.location.href);
    if (region) url.searchParams.set("in", region);
    else url.searchParams.delete("in");
    if (area) url.searchParams.set("area", area);
    else url.searchParams.delete("area");
    // replaceState, not push: the filter is a view of the same page, and
    // burying the browser's back button under six chip presses is hostile.
    window.history.replaceState(null, "", url);
  }

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

  // Every college within reach at this rank, ignoring the filter — it feeds the
  // chip counts, and tells the empty state whether the filter is what emptied
  // the list or whether the rank simply reaches nothing at all.
  const reachable = useMemo(() => reachableCollegeCodes(rank), [rank]);

  const codes = useMemo(
    () => codesFor(place.region, place.area),
    [place.region, place.area],
  );
  const where = placePhrase(place.region, place.area);

  const matches = useMemo(
    () => (rank > 0 ? predict(rank, { collegeCodes: codes }) : []),
    [rank, codes],
  );
  const groups = useMemo(() => groupByFamily(matches), [matches]);

  const hasRank = rank > 0;
  const totalMatches = matches.length;

  // Only pure CSE is open on arrival — it's the branch nearly every student
  // checks first, and a hundred rows of everything else buries it. Toggles
  // survive rank edits on purpose: the list re-sorts as you type, and
  // re-collapsing a section the student just opened would fight them.
  const [openFamilies, setOpenFamilies] = useState<
    Partial<Record<BranchFamily, boolean>>
  >({ cse: true });

  function toggleFamily(family: BranchFamily) {
    setOpenFamilies((prev) => ({ ...prev, [family]: !prev[family] }));
  }

  // Publish the rank so the header's WhatsApp link opens a thread that already
  // states it. Debounced by useDeferredValue upstream, so this doesn't fire on
  // every keystroke of a six-digit number.
  const { setRank } = useRank();
  useEffect(() => {
    setRank(rank);
  }, [rank, setRank]);

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

      {/* Results */}
      <div ref={resultsRef} className="mt-16 scroll-mt-6">
        {!hasRank && <EmptyState />}

        {/* The filter only exists once the tool has produced something to
            filter — on the empty state it would be furniture. */}
        {hasRank && reachable.size > 0 && (
          <div className="mb-12">
            <LocationFilter
              regionId={place.region}
              areaSlug={place.area}
              onChange={changePlace}
              reachable={reachable}
            />
          </div>
        )}

        {hasRank && totalMatches === 0 && reachable.size === 0 && (
          <NoMatches rank={rank} />
        )}

        {hasRank && totalMatches === 0 && reachable.size > 0 && where && (
          <NoneHere
            rank={rank}
            where={where}
            onClear={() => changePlace(null, null)}
          />
        )}

        {hasRank && totalMatches > 0 && (
          <>
            <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-3">
              <span className="eyebrow shrink-0">your options</span>
              <span className="font-mono text-[12px] text-fg-mute tabular-nums text-right">
                {formatRank(totalMatches)} found
                {where && <> in <span className="text-fg">{where}</span></>} ·
                ranked at <span className="text-fg">{formatRank(rank)}</span>
              </span>
            </div>

            {groups.map((g) => {
              const open = openFamilies[g.family] ?? false;
              const panelId = `family-${g.family}`;
              return (
                <div key={g.family}>
                  <SectionHead
                    label={FAMILY_LABEL[g.family]}
                    count={g.items.length}
                    expanded={open}
                    onToggle={() => toggleFamily(g.family)}
                    controls={panelId}
                  />
                  {open && (
                    <div id={panelId} className="section-panel">
                      {g.items.map((m) => (
                        <ResultRow
                          key={`${m.collegeCode}-${m.branchCode}`}
                          m={m}
                          rank={rank}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Sits after the full list, never inside it — the student gets
                every result first, then the offer to help read them. */}
            <CounselCTA
              placement="results"
              rank={rank}
              matchCount={totalMatches}
              eyebrow="next step"
              // With a filter on, "every seat your rank reaches" would be a
              // false claim about a deliberately narrowed list.
              head={
                where
                  ? `That's every seat your rank reaches in ${where}.`
                  : "That's every seat your rank reaches."
              }
              headTail="Choosing between them is the harder question."
              body="A closing rank tells you where you stand. It doesn't tell you which of these actually recruits in your branch, what the fee works out to over four years, or which are worth taking on a management seat. That is the part MindCreed does — and we've filmed student reviews on many of these campuses."
              ctaLabel="Ask about my options"
            />
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
        Empty until a rank is entered.
      </p>
    </div>
  );
}

/**
 * Empty because of the filter, not because of the rank — a different situation
 * from NoMatches and it gets a different answer. There is no CTA here on
 * purpose: nothing has failed yet, the student is one press away from a full
 * list, and selling into a dead end the tool created itself would be the
 * cheapest kind of lead capture.
 */
function NoneHere({
  rank,
  where,
  onClear,
}: {
  rank: number;
  where: string;
  onClear: () => void;
}) {
  return (
    <div className="border-t border-hairline pt-10">
      <p className="display text-[28px] leading-snug max-w-lg">
        Nothing in {where} at rank{" "}
        <span className="font-mono">{formatRank(rank)}</span>.{" "}
        <span className="display-italic text-fg-mute">
          Elsewhere, there is.
        </span>
      </p>
      <p className="mt-3 text-[14px] text-fg-mute max-w-md">
        Every cut-off in {where} closed earlier than this number. Widen the
        search, or try one of the other regions above.
      </p>
      <button type="button" onClick={onClear} className="cta-quiet mt-6">
        Show colleges anywhere →
      </button>
    </div>
  );
}

/**
 * The dead end — and the highest-intent moment in the app. A student who sees
 * this is out of obvious options and actively looking for a way forward, which
 * is precisely what a counsellor is for. The original copy already said the
 * honest thing (other rounds and quotas exist); this just gives that sentence
 * somewhere to lead.
 */
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

      <CounselCTA
        placement="no-matches"
        rank={rank}
        className="mt-14"
        eyebrow="what now"
        head="Round 3 is not the whole story."
        headTail="There are seats this list cannot see."
        body="Everything above comes from one round of one exam, General Merit only. Later rounds, category seats, management and NRI quota sit outside it entirely. That is the conversation MindCreed has with students every admission season — tell us your rank and we'll tell you what's actually open."
        ctaLabel="Ask about my options"
      />
    </div>
  );
}

