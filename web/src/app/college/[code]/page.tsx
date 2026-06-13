import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCollege, listColleges } from "@/lib/colleges";
import { getCollegeRecords } from "@/lib/college-records";
import { CollegeHero } from "@/components/college/CollegeHero";
import { PlacementStrip } from "@/components/college/PlacementStrip";
import { PodcastEmbed } from "@/components/college/PodcastEmbed";
import { CollegeCutoffTable } from "@/components/college/CollegeCutoffTable";

export function generateStaticParams() {
  return listColleges().map((c) => ({ code: c.code }));
}

const SITE_URL = "https://comedkrankvscollege.vercel.app";

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

  const backHref = hasRank ? `/?rank=${userRank}` : "/";

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
    <main className="mx-auto w-full max-w-3xl px-6 sm:px-10 pt-10 sm:pt-14 pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Quiet back nav — small mono link with the same hover wipe as the rest. */}
      <nav className="pb-10">
        <Link
          href={backHref}
          className="linkmark font-mono text-[12px] text-fg-mute tracking-wider"
        >
          ← back to predictor
          {hasRank && (
            <span className="text-fg-dim"> · rank {userRank!.toLocaleString("en-IN")}</span>
          )}
        </Link>
      </nav>

      <CollegeHero college={college} />

      <PlacementStrip placement={college.placement} />

      {college.podcast && <PodcastEmbed podcast={college.podcast} />}

      <CollegeCutoffTable records={records} hasRank={hasRank} />
    </main>
  );
}
