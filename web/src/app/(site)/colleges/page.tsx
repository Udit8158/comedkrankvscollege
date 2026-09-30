import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CollegeRow } from "@/components/CollegeRow";
import { BrowseNav } from "@/components/BrowseNav";
import {
  DIRECTORY_TOTAL,
  DIRECTORY_WITH_CUTOFFS,
  directoryRegions,
} from "@/lib/directory";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "All COMEDK Colleges",
  description: `Every one of the ${DIRECTORY_TOTAL} engineering colleges in the COMEDK 2026 Round 3 allotment, grouped by region — with the lowest cut-off rank, branch count and founding year for each.`,
  alternates: { canonical: "/colleges" },
  openGraph: {
    type: "website",
    url: "/colleges",
    title: `All ${DIRECTORY_TOTAL} COMEDK Colleges — Cut-offs by Region`,
    description: `Browse every COMEDK engineering college in Karnataka by region, with official 2026 Round 3 cut-off ranks.`,
  },
};

export default function CollegesIndex() {
  const regions = directoryRegions();

  // The directory is a list of colleges, and saying so lets Google read the
  // relationship between this page and the 150 it points at rather than
  // inferring it from anchors alone.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "COMEDK engineering colleges",
    description: `Engineering colleges in the COMEDK 2026 Round 3 allotment.`,
    numberOfItems: DIRECTORY_TOTAL,
    itemListElement: regions
      .flatMap((r) => r.entries)
      .map((e, i) => ({
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
        trail={[{ label: "predictor", href: "/" }, { label: "colleges" }]}
      />

      <header>
        <p className="eyebrow">comedk · round 3 2026 · general merit</p>
        <h1 className="display text-[44px] sm:text-[60px] md:text-[72px] leading-[0.96] mt-4 tracking-tight">
          Every college
          <br />
          <span className="display-italic">on the list.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[15px] text-fg-mute leading-relaxed">
          All {DIRECTORY_TOTAL} engineering colleges COMEDK allotted seats in,
          grouped by where they are. The number on the right is the lowest rank
          that got a seat anywhere in that college — the closest thing the data
          can honestly say about how hard it is to get in.
        </p>
        <p className="mt-4 max-w-xl text-[13px] text-fg-dim leading-relaxed">
          {DIRECTORY_WITH_CUTOFFS} of them had a Round 3 General Merit
          allotment. The other {DIRECTORY_TOTAL - DIRECTORY_WITH_CUTOFFS} are
          listed too — their branches filled in earlier rounds, so there is no
          Round 3 number to show.
        </p>
      </header>

      {regions.map((region) => (
        <section key={region.id} className="mt-16">
          <div className="flex items-baseline justify-between border-b border-hairline pb-3">
            <h2 className="eyebrow">{region.label}</h2>
            <span className="font-mono text-[12px] text-fg-mute tabular-nums">
              {region.entries.length}{" "}
              {region.entries.length === 1 ? "college" : "colleges"}
            </span>
          </div>
          <div>
            {region.entries.map((entry) => (
              <CollegeRow key={entry.college.code} entry={entry} />
            ))}
          </div>
        </section>
      ))}

      <BrowseNav />
    </main>
  );
}
