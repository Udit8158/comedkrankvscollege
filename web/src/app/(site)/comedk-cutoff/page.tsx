import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BRANCH_FACETS } from "@/lib/facets";
import { formatRank } from "@/lib/utils";

export const metadata: Metadata = {
  title: "COMEDK Cut-offs by Branch",
  description:
    "COMEDK 2026 Round 3 cut-off ranks for every major engineering branch — CSE, ECE, AI/ML, Information Science, Mechanical, Civil and more, across Karnataka colleges.",
  alternates: { canonical: "/comedk-cutoff" },
  openGraph: {
    type: "website",
    url: "/comedk-cutoff",
    title: "COMEDK Cut-offs by Branch",
    description:
      "Official COMEDK 2026 Round 3 closing ranks for every major engineering branch across Karnataka.",
  },
};

export default function BranchIndex() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 sm:px-10 pt-6 sm:pt-10 pb-32">
      <Breadcrumbs
        trail={[{ label: "predictor", href: "/" }, { label: "by branch" }]}
      />

      <header>
        <p className="eyebrow">comedk · round 3 2026 · general merit</p>
        <h1 className="display text-[44px] sm:text-[60px] md:text-[72px] leading-[0.96] mt-4 tracking-tight">
          Cut-offs,
          <br />
          <span className="display-italic">branch by branch.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[15px] text-fg-mute leading-relaxed">
          The {BRANCH_FACETS.length} branches with enough Round 3 General Merit
          allotments to say something useful. Each page lists every college that
          filled it, best closing rank first.
        </p>
      </header>

      <div className="mt-14">
        <div className="flex items-baseline justify-between border-b border-hairline pb-3">
          <span className="eyebrow">branch</span>
          <span className="eyebrow">best · colleges</span>
        </div>
        {BRANCH_FACETS.map((b) => (
          <Link
            key={b.slug}
            href={`/comedk-cutoff/${b.slug}`}
            className="row block py-4 sm:grid sm:grid-cols-[52px_1fr_auto] sm:gap-x-5 group"
          >
            <div className="font-mono text-[11px] sm:text-[12px] tracking-wider text-fg-mute sm:pt-[3px] group-hover:text-accent transition-colors">
              {b.code}
            </div>
            <div className="min-w-0 mt-1 sm:mt-0 text-[15px] leading-snug text-fg">
              <span className="linkmark">{b.name}</span>
            </div>
            <div className="mt-2 sm:mt-0 flex items-baseline gap-4 sm:justify-end tabular-nums">
              <span className="font-mono text-[15px] text-fg">
                {formatRank(b.seats[0].cutoff)}
              </span>
              <span className="font-mono text-[11px] text-fg-dim tracking-wider">
                {b.seats.length} colleges
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
