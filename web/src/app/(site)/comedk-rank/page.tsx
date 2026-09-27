import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { reachableCollegeCodes } from "@/lib/predict";
import { MAX_CUTOFF, RANK_BANDS } from "@/lib/rank-bands";
import { formatRank } from "@/lib/utils";

export const metadata: Metadata = {
  title: "COMEDK Rank vs College — Every Rank Band",
  description:
    "What each COMEDK rank band can reach, from under 1,000 to above 1,00,000 — colleges and branches from the official COMEDK 2025 Round 3 cut-offs.",
  alternates: { canonical: "/comedk-rank" },
  openGraph: {
    type: "website",
    url: "/comedk-rank",
    title: "COMEDK Rank vs College — Every Rank Band",
    description:
      "Nine rank bands, each showing the colleges and branches it reaches in the official COMEDK 2025 Round 3 cut-offs.",
  },
};

export default function RankBandsIndex() {
  const rows = RANK_BANDS.map((band) => ({
    band,
    reachable: reachableCollegeCodes(band.reference).size,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl px-6 sm:px-10 pt-6 sm:pt-10 pb-32">
      <Breadcrumbs
        trail={[{ label: "predictor", href: "/" }, { label: "by rank" }]}
      />

      <header>
        <p className="eyebrow">comedk · round 3 2025 · general merit</p>
        <h1 className="display text-[44px] sm:text-[60px] md:text-[72px] leading-[0.96] mt-4 tracking-tight">
          What each rank
          <br />
          <span className="display-italic">actually reaches.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[15px] text-fg-mute leading-relaxed">
          Nine bands, each computed at its weakest rank so the list is a floor
          rather than a best case. The count is colleges with at least one
          branch in reach — the honest unit for &ldquo;is there anything here
          for me&rdquo;.
        </p>
        <p className="mt-4 max-w-xl text-[13px] text-fg-dim leading-relaxed">
          The highest Round 3 General Merit cut-off recorded was{" "}
          <span className="font-mono">{formatRank(MAX_CUTOFF)}</span>. Above
          that, the round had closed.
        </p>
      </header>

      <div className="mt-14">
        <div className="flex items-baseline justify-between border-b border-hairline pb-3">
          <span className="eyebrow">rank band</span>
          <span className="eyebrow">colleges in reach</span>
        </div>
        {rows.map(({ band, reachable }) => (
          <Link
            key={band.slug}
            href={`/comedk-rank/${band.slug}`}
            className="row block py-5 flex items-baseline justify-between gap-6 group"
          >
            <span className="text-[17px] sm:text-[19px] text-fg">
              <span className="linkmark">{band.label}</span>
            </span>
            <span className="font-mono text-[15px] text-fg-mute tabular-nums group-hover:text-accent transition-colors">
              {reachable === 0 ? "—" : reachable}
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-10 max-w-xl text-[14px] text-fg-mute leading-relaxed">
        Know the exact number?{" "}
        <Link href="/" className="linkmark text-fg">
          Type it into the predictor
        </Link>{" "}
        — it reads the same data without rounding you into a band.
      </p>
    </main>
  );
}
