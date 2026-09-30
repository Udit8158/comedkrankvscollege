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
          round 3 · 2026
        </span>
      </header> */}

      <div className="pt-10">
        {/* <p className="eyebrow">2026 Engineering · General Merit</p> */}
        {/* Two lines, second in italic — the shape every other H1 on the site
            uses ("Every college / on the list.", "What each rank / actually
            reaches."). The break falls after "vs" so the italic line carries
            the destination, and the type is smaller than the old "College /
            Predictor." because the phrase is twice as long: at 88px it ran
            past the measure.

            It names COMEDK and the year on purpose. The old headline was the
            better piece of writing and worth nothing in search — this is the
            page that has to rank for "COMEDK rank vs college", and the H1 was
            the one place that phrase did not appear. The provenance (which
            round, which year, GM only) still sits under the rank input, where
            it is read at the moment it matters. */}
        <h1 className="display text-[32px] min-[390px]:text-[40px] sm:text-[58px] md:text-[80px] leading-[0.96] mt-3 tracking-tight">
          COMEDK Rank vs
          <br />
          <span className="display-italic">College in 2027.</span>
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
