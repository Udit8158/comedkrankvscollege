import { Suspense } from "react";
import { Predictor } from "@/components/Predictor";
import { StartingList } from "@/components/StartingList";
import { BrowseNav } from "@/components/BrowseNav";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 sm:px-10 pt-8 sm:pt-14 pb-32">
      {/* <header className="flex items-center justify-between border-b border-hairline pb-6">
        <div className="flex items-center gap-3">
          <span className="brass-tick h-5 inline-block" />
          <span className="eyebrow text-fg">comedk · cut-off lookup</span>
        </div>
        <span className="font-mono text-[11px] text-fg-mute tracking-wider">
          round 3 · 2025
        </span>
      </header> */}

      <div className="pt-10">
        {/* <p className="eyebrow">2025 Engineering · General Merit</p> */}
        {/* Two lines, second in italic — the same shape the old "From rank /
            to college." had, so the page keeps its proportions now that the
            standfirst is gone. The provenance that paragraph carried (which
            round, which year, GM only) is not lost: it sits under the rank
            input, where it is read at the moment it actually matters. */}
        <h1 className="display text-[48px] sm:text-[72px] md:text-[88px] leading-[0.92] mt-3 tracking-tight">
          College
          <br />
          <span className="display-italic">Predictor.</span>
        </h1>
      </div>

      <div className="mt-16">
        <Suspense fallback={null}>
          <Predictor />
        </Suspense>
      </div>

      {/* Server-rendered, and therefore the first college names on this page a
          crawler has ever been able to read — the predictor's own results are
          client-side and arrive after a keystroke. */}
      <StartingList />

      <BrowseNav />

    </main>
  );
}
