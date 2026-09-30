import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CollegeRow } from "@/components/CollegeRow";
import { CounselCTA } from "@/components/CounselCTA";
import { CITY_FACETS, cityFacetBySlug } from "@/lib/facets";
import { formatRank } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return CITY_FACETS.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const facet = cityFacetBySlug(slug);
  if (!facet) return { title: "City not found" };

  const canonical = `/comedk-colleges-in/${facet.slug}`;
  const title = `COMEDK Colleges in ${facet.city} — Cut-off Ranks`;
  const description = `All ${facet.entries.length} COMEDK engineering colleges in ${facet.city}, with official 2026 Round 3 cut-off ranks, branches and placement figures.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const facet = cityFacetBySlug(slug);
  if (!facet) notFound();

  const best = facet.entries[0];
  const branches = facet.entries.reduce((n, e) => n + e.branchCount, 0);
  const others = CITY_FACETS.filter((c) => c.slug !== facet.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `COMEDK engineering colleges in ${facet.city}`,
    numberOfItems: facet.entries.length,
    itemListElement: facet.entries.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/college/${e.college.code}`,
      name: e.college.name,
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
          { label: "colleges", href: "/colleges" },
          { label: facet.city },
        ]}
      />

      <header>
        <p className="eyebrow">comedk · round 3 2026 · general merit</p>
        <h1 className="display text-[42px] sm:text-[58px] md:text-[68px] leading-[0.96] mt-4 tracking-tight">
          COMEDK colleges
          <br />
          <span className="display-italic">{`in ${facet.city}.`}</span>
        </h1>
        <p className="mt-6 max-w-xl text-[15px] text-fg-mute leading-relaxed">
          {facet.entries.length} colleges, {branches} branches with a Round 3
          General Merit cut-off. The hardest seat in {facet.city} went to rank{" "}
          <span className="font-mono text-fg">
            {formatRank(best.benchmark ?? 0)}
          </span>
          , at {best.college.name}.
        </p>
        <p className="mt-4 max-w-xl text-[13px] text-fg-dim leading-relaxed">
          The number beside each college is the lowest rank that got a seat
          there in any branch — the closest thing the data can honestly say
          about how hard it is to get in.
        </p>
      </header>

      <div className="mt-14">
        <div className="flex items-baseline justify-between border-b border-hairline pb-3">
          <h2 className="eyebrow">hardest first</h2>
          <span className="font-mono text-[12px] text-fg-mute tabular-nums">
            {facet.entries.length} colleges
          </span>
        </div>
        {facet.entries.map((entry) => (
          <CollegeRow key={entry.college.code} entry={entry} />
        ))}
      </div>

      <nav className="mt-20 border-t border-hairline pt-6">
        <p className="eyebrow">elsewhere in karnataka</p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12px] tracking-wider">
          {others.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/comedk-colleges-in/${c.slug}`}
                className="linkmark text-fg-mute"
              >
                {c.city}{" "}
                <span className="text-fg-dim">({c.entries.length})</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/colleges" className="linkmark text-fg-mute">
              all 150 →
            </Link>
          </li>
        </ul>
      </nav>

      <CounselCTA
        placement="results"
        eyebrow="counselling"
        head={`Which of these is right for you`}
        headTail="is not a question a table answers."
        body={`Fees, hostel, the commute across ${facet.city}, and which companies actually turn up for your branch — MindCreed counsels students into these colleges every COMEDK season and films student reviews on their campuses.`}
        ctaLabel="Ask about a college"
      />
    </main>
  );
}
