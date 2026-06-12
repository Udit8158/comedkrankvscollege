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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const c = getCollege(code);
  if (!c) return { title: "College not found" };
  const place = [c.locality, c.city].filter(Boolean).join(", ");
  return {
    title: `${c.name} · COMEDK cut-offs`,
    description: place
      ? `Round 3 2025 cut-off ranks for ${c.name} (${place}).`
      : `Round 3 2025 cut-off ranks for ${c.name}.`,
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

  return (
    <main className="mx-auto w-full max-w-3xl px-6 sm:px-10 pt-10 sm:pt-14 pb-32">
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
