import { Predictor } from "@/components/Predictor";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 sm:px-10 pt-16 sm:pt-24 pb-32">
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
        <h1 className="display text-[48px] sm:text-[72px] md:text-[88px] leading-[0.92] mt-3 tracking-tight">
          From rank
          <br />
          <span className="display-italic">to seat.</span>
        </h1>
        <p className="mt-6 max-w-md text-[15px] text-fg-mute leading-relaxed">
          A direct lookup against last year&apos;s official Round 3 cut-offs.
          Enter a rank, see the colleges and branches that actually closed at or
          after it — computing branches first, core last.
        </p>
      </div>

      <div className="mt-20">
        <Predictor />
      </div>

      <footer className="mt-32 pt-6 border-t border-hairline flex flex-wrap items-center justify-between gap-y-3 text-[12px] text-fg-mute">
        <span>
          Source: Engineering Cut-off Ranks after Round 3 Allotment, notified
          22.08.2025.
        </span>
        <span className="font-mono text-[11px] tracking-wider">
          no warranty · informational
        </span>
      </footer>
    </main>
  );
}
