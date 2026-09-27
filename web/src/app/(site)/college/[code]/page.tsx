import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCollege, listColleges } from "@/lib/colleges";
import { regionIdForCity, regionLabel } from "@/lib/locations";
import { getCollegeRecords } from "@/lib/college-records";
import { CollegeHero } from "@/components/college/CollegeHero";
import { PlacementStrip } from "@/components/college/PlacementStrip";
import { PodcastEmbed } from "@/components/college/PodcastEmbed";
import { CollegeCutoffTable } from "@/components/college/CollegeCutoffTable";
import { RelatedColleges } from "@/components/college/RelatedColleges";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CounselCTA } from "@/components/CounselCTA";
import { RankSync } from "@/components/RankContext";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return listColleges().map((c) => ({ code: c.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const c = getCollege(code);
  if (!c) return { title: "College not found" };
  const place = [c.locality, c.city].filter(Boolean).join(", ");
  const canonical = `/college/${c.code}`;

  const bits: string[] = [];
  if (c.established) bits.push(`established ${c.established}`);
  if (c.placement?.overallAvgLpa)
    bits.push(`avg package ₹${c.placement.overallAvgLpa} LPA`);
  const extra = bits.length ? ` ${bits.join(", ")}.` : "";

  const description = `COMEDK 2026 cut-off ranks for ${c.name}${
    place ? `, ${place}` : ""
  }.${extra} Based on the official COMEDK 2025 Round 3 cut-offs.`;

  return {
    title: c.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${c.name} — COMEDK 2026 Cutoffs & Placements`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${c.name} — COMEDK 2026`,
      description,
    },
  };
}

export default async function CollegePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ rank?: string }>;
}) {
  const { code } = await params;
  const { rank: rankStr } = await searchParams;
  const college = getCollege(code);
  if (!college) notFound();

  const parsedRank = rankStr ? parseInt(rankStr, 10) : NaN;
  const hasRank = Number.isFinite(parsedRank) && parsedRank > 0;
  const userRank = hasRank ? parsedRank : undefined;
  const records = getCollegeRecords(code, userRank);

  // The trail is the page's position in the site, so it is built from the
  // college's own region rather than from wherever the student came in. The
  // rank rides along on the predictor link so stepping back up does not throw
  // away what they typed.
  const region = regionIdForCity(college.city);
  const trail = [
    { label: "predictor", href: hasRank ? `/?rank=${userRank}` : "/" },
    { label: "colleges", href: "/colleges" },
    ...(region ? [{ label: regionLabel(region).toLowerCase(), href: "/colleges" }] : []),
    { label: college.name },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    name: college.name,
    url: college.website || `${SITE_URL}/college/${college.code}`,
    ...(college.established
      ? { foundingDate: String(college.established) }
      : {}),
    ...(college.locality || college.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(college.locality ? { streetAddress: college.locality } : {}),
            ...(college.city ? { addressLocality: college.city } : {}),
            addressRegion: "Karnataka",
            addressCountry: "IN",
          },
        }
      : {}),
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 sm:px-10 pt-6 sm:pt-10 pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs trail={trail} />

      <CollegeHero college={college} />

      <PlacementStrip placement={college.placement} />

      {college.podcast && <PodcastEmbed podcast={college.podcast} />}

      <CollegeCutoffTable records={records} hasRank={hasRank} />

      <RelatedColleges
        code={college.code}
        city={college.city}
        rank={userRank}
      />

      {/* Deepest intent in the app: they left the list to read about one
          specific campus. The pre-filled message names it, so the counsellor
          opens on the right college instead of asking which one. */}
      <CounselCTA
        placement="college"
        rank={userRank}
        collegeName={college.name}
        collegeCode={college.code}
        eyebrow="admission"
        head="Numbers only go so far."
        headTail="Ask someone who has been on this campus."
        body={`Fees, hostel, which companies actually turn up for your branch, and whether a management seat here is worth what it costs — none of that is in a cut-off table. MindCreed counsels students into Bengaluru engineering colleges and films student reviews on campuses like ${college.name}.`}
        ctaLabel="Ask about this college"
      />

      {/* Hands the ?rank= this page was opened with to the header CTA. */}
      <RankSync rank={userRank} />
    </main>
  );
}
