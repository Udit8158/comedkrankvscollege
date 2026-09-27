import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SectionHead } from "@/components/SectionHead";
import { ResultRow } from "@/components/ResultRow";
import { CounselCTA } from "@/components/CounselCTA";
import { FAMILY_LABEL } from "@/lib/branches";
import { groupByFamily, predict, reachableCollegeCodes } from "@/lib/predict";
import {
  MAX_CUTOFF,
  RANK_BANDS,
  bandBySlug,
  bandNeighbours,
} from "@/lib/rank-bands";
import { formatRank } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return RANK_BANDS.map((b) => ({ band: b.slug }));
}

/** Wider than the predictor's caps. The tool answers "what should I look at
 *  first"; this page answers "what is the whole field at this rank", and a
 *  reader who arrived from a search wants the field. */
const PAGE_LIMITS = { cse: 15, cse_spec: 25, electronics: 15, core: 25 };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ band: string }>;
}): Promise<Metadata> {
  const { band: slug } = await params;
  const band = bandBySlug(slug);
  if (!band) return { title: "Rank band not found" };

  const reachable = reachableCollegeCodes(band.reference).size;
  const canonical = `/comedk-rank/${band.slug}`;
  const title = `COMEDK Rank ${band.label} — Which College Can You Get?`;
  const description =
    band.to === null
      ? `COMEDK ranks above ${formatRank(band.from)}: what the official 2025 Round 3 cut-offs show. The highest General Merit cut-off recorded was ${formatRank(MAX_CUTOFF)}.`
      : `Colleges and branches a COMEDK rank of ${band.label} can reach — ${reachable} colleges, from the official COMEDK 2025 Round 3 cut-offs.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function RankBandPage({
  params,
}: {
  params: Promise<{ band: string }>;
}) {
  const { band: slug } = await params;
  const band = bandBySlug(slug);
  if (!band) notFound();

  const matches = predict(band.reference, { familyLimits: PAGE_LIMITS });
  const groups = groupByFamily(matches);
  const reachable = reachableCollegeCodes(band.reference).size;
  const { prev, next } = bandNeighbours(band);

  const empty = matches.length === 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `COMEDK colleges for rank ${band.label}`,
    numberOfItems: matches.length,
    itemListElement: matches.slice(0, 50).map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/college/${m.collegeCode}`,
      name: `${m.collegeName} — ${m.branchName}`,
    })),
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 sm:px-10 pt-6 sm:pt-10 pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        trail={[
          { label: "predictor", href: "/" },
          { label: "by rank", href: "/comedk-rank" },
          { label: band.label },
        ]}
      />

      <header>
        <p className="eyebrow">comedk · round 3 2025 · general merit</p>
        <h1 className="display text-[40px] sm:text-[56px] md:text-[64px] leading-[0.98] mt-4 tracking-tight">
          COMEDK rank {band.label}
          <br />
          <span className="display-italic">which college?</span>
        </h1>

        {empty ? (
          <p className="mt-6 max-w-xl text-[15px] text-fg-mute leading-relaxed">
            No Round 3 General Merit seat was allotted above{" "}
            <span className="font-mono text-fg">{formatRank(MAX_CUTOFF)}</span>.
            That is the highest cut-off in the official list — beyond it, the
            General Merit round had closed. A seat may still be reachable
            through a later round or a management quota, which is a
            conversation rather than a table.
          </p>
        ) : (
          <>
            <p className="mt-6 max-w-xl text-[15px] text-fg-mute leading-relaxed">
              Every branch below closed at or after a rank of{" "}
              <span className="font-mono text-fg">
                {formatRank(band.reference)}
              </span>{" "}
              in the official COMEDK 2025 Round 3 allotment —{" "}
              <span className="font-mono text-fg">{reachable}</span> colleges in
              reach.
            </p>
            {/* The one sentence that makes this page honest rather than
                optimistic. A closed band is computed at its worst rank, so the
                list is a floor for everyone reading it. The open-ended band has
                no worst rank — it is computed at the highest cut-off in the
                data, and past that point the round simply had no seats left,
                which is the more useful thing to say. */}
            <p className="mt-4 max-w-xl text-[13px] text-fg-dim leading-relaxed">
              {band.to === null ? (
                <>
                  The highest Round 3 General Merit cut-off in the official list
                  is{" "}
                  <span className="font-mono">{formatRank(MAX_CUTOFF)}</span>,
                  so this is everything the round still had open near the bottom
                  of it. Above that rank no General Merit seat was allotted at
                  all — a later round or a management seat is the remaining
                  route, and that is a conversation rather than a table.
                </>
              ) : (
                <>
                  Computed at {formatRank(band.reference)}, the weakest rank in
                  this band, so nothing here depends on being at the good end of
                  it. If your rank is better than that, this list is your floor,
                  not your ceiling —{" "}
                  <Link href="/" className="linkmark text-fg-mute">
                    enter it in the predictor
                  </Link>{" "}
                  for the exact answer.
                </>
              )}
            </p>
          </>
        )}
      </header>

      {!empty && (
        <div className="mt-14">
          {groups.map((g) => (
            <div key={g.family}>
              <SectionHead
                label={FAMILY_LABEL[g.family]}
                count={g.items.length}
              />
              <div>
                {g.items.map((m) => (
                  <ResultRow
                    key={`${m.collegeCode}-${m.branchCode}`}
                    m={m}
                    rank={band.reference}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Walking the bands is how a student finds the page that is actually
          theirs, and how the nine pages pass authority to each other rather
          than each hanging off the home page alone. */}
      <nav className="mt-20 border-t border-hairline pt-6 flex items-baseline justify-between gap-6 font-mono text-[12px] tracking-wider">
        {prev ? (
          <Link href={`/comedk-rank/${prev.slug}`} className="linkmark text-fg-mute">
            ← {prev.label}
          </Link>
        ) : (
          <span />
        )}
        <Link href="/comedk-rank" className="linkmark text-fg-mute">
          all bands
        </Link>
        {next ? (
          <Link href={`/comedk-rank/${next.slug}`} className="linkmark text-fg-mute text-right">
            {next.label} →
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <CounselCTA
        placement="results"
        rank={band.reference}
        eyebrow="counselling"
        head="A list is where the decision starts."
        headTail="Not where it ends."
        body={`Which of these is worth the fees, which branch actually places, and what a management seat costs if the rank falls short — MindCreed counsels students through exactly this call every COMEDK season.`}
        ctaLabel="Talk it through"
      />
    </main>
  );
}
