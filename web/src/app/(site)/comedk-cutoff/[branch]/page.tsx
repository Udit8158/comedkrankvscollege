import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CounselCTA } from "@/components/CounselCTA";
import { BRANCH_FACETS, branchFacetBySlug } from "@/lib/facets";
import { formatRank } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return BRANCH_FACETS.map((b) => ({ branch: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ branch: string }>;
}): Promise<Metadata> {
  const { branch: slug } = await params;
  const facet = branchFacetBySlug(slug);
  if (!facet) return { title: "Branch not found" };

  const canonical = `/comedk-cutoff/${facet.slug}`;
  const best = facet.seats[0];
  const last = facet.seats[facet.seats.length - 1];
  const title = `COMEDK ${facet.name} Cut-off — All Colleges`;
  const description = `COMEDK 2025 Round 3 cut-off ranks for ${facet.name} at ${facet.seats.length} Karnataka colleges — from ${formatRank(best.cutoff)} at ${best.collegeName} to ${formatRank(last.cutoff)}.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BranchPage({
  params,
}: {
  params: Promise<{ branch: string }>;
}) {
  const { branch: slug } = await params;
  const facet = branchFacetBySlug(slug);
  if (!facet) notFound();

  const best = facet.seats[0];
  const last = facet.seats[facet.seats.length - 1];
  const others = BRANCH_FACETS.filter((b) => b.slug !== facet.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `COMEDK ${facet.name} cut-offs`,
    numberOfItems: facet.seats.length,
    itemListElement: facet.seats.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/college/${s.collegeCode}`,
      name: s.collegeName,
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
          { label: "by branch", href: "/comedk-cutoff" },
          { label: facet.code },
        ]}
      />

      <header>
        <p className="eyebrow">
          comedk · round 3 2025 · general merit · {facet.code}
        </p>
        <h1 className="display text-[38px] sm:text-[52px] md:text-[60px] leading-[1.0] mt-4 tracking-tight">
          {facet.name}
          <br />
          <span className="display-italic">cut-offs.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[15px] text-fg-mute leading-relaxed">
          Every college that filled {facet.name} in the official COMEDK 2025
          Round 3 allotment — {facet.seats.length} of them, from rank{" "}
          <span className="font-mono text-fg">{formatRank(best.cutoff)}</span>{" "}
          at {best.collegeName} down to{" "}
          <span className="font-mono text-fg">{formatRank(last.cutoff)}</span>.
        </p>
        <p className="mt-4 max-w-xl text-[13px] text-fg-dim leading-relaxed">
          A cut-off is the last rank that got a seat, not a pass mark. It moves
          every year with the paper and the applicant pool —{" "}
          <Link href="/" className="linkmark text-fg-mute">
            check your own rank against it
          </Link>
          .
        </p>
      </header>

      <div className="mt-14">
        <div className="flex items-baseline justify-between border-b border-hairline pb-3">
          <h2 className="eyebrow">closing rank · lowest first</h2>
          <span className="font-mono text-[12px] text-fg-mute tabular-nums">
            {facet.seats.length} colleges
          </span>
        </div>
        {facet.seats.map((seat) => (
          <Link
            key={seat.collegeCode}
            href={`/college/${seat.collegeCode}`}
            prefetch={false}
            className="row block py-4 sm:grid sm:grid-cols-[64px_1fr_auto] sm:gap-x-5 group"
          >
            <div className="font-mono text-[11px] sm:text-[12px] tracking-wider text-fg-mute sm:pt-[3px] group-hover:text-accent transition-colors">
              {seat.collegeCode}
            </div>
            <div className="min-w-0 mt-1 sm:mt-0">
              <div className="text-[15px] leading-snug text-fg">
                <span className="linkmark">{seat.collegeName}</span>
              </div>
              {seat.place && (
                <div className="text-[13px] text-fg-mute mt-0.5">
                  {seat.place}
                </div>
              )}
            </div>
            <div className="mt-2 sm:mt-0 sm:text-right tabular-nums">
              <span className="font-mono text-[15px] text-fg">
                {formatRank(seat.cutoff)}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <nav className="mt-20 border-t border-hairline pt-6">
        <p className="eyebrow">other branches</p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12px] tracking-wider">
          {others.map((b) => (
            <li key={b.slug}>
              <Link
                href={`/comedk-cutoff/${b.slug}`}
                className="linkmark text-fg-mute"
              >
                {b.code} <span className="text-fg-dim">({b.seats.length})</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <CounselCTA
        placement="results"
        eyebrow="counselling"
        head={`${facet.code} everywhere is not the same ${facet.code}.`}
        body={`The same branch code places very differently across these colleges — labs, faculty, and which companies turn up in the placement week. MindCreed counsels students through that comparison every COMEDK season.`}
        ctaLabel="Ask which one fits"
      />
    </main>
  );
}
