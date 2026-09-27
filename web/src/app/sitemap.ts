import type { MetadataRoute } from "next";
import { listColleges } from "@/lib/colleges";
import { BRANCH_FACETS, CITY_FACETS } from "@/lib/facets";
import { RANK_BANDS } from "@/lib/rank-bands";
import { SITE_URL } from "@/lib/site";

/**
 * When the underlying cut-off data was published by COMEDK.
 *
 * Not `new Date()`. A sitemap that stamps every URL with the build time claims
 * every page changed whenever the site was redeployed, which is false for
 * almost all of them — and a `lastmod` a crawler catches lying is a `lastmod`
 * it learns to ignore. This is the date the numbers on these pages actually
 * come from, so it moves when they do.
 *
 * Update this alongside `data.json` when a new year's PDF lands.
 */
const DATA_PUBLISHED = new Date("2025-08-22T00:00:00Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const entry = (
    path: string,
    priority: number,
    changeFrequency: "weekly" | "monthly",
  ) => ({
    url: `${SITE_URL}${path}`,
    lastModified: DATA_PUBLISHED,
    changeFrequency,
    priority,
  });

  return [
    entry("", 1, "weekly"),

    // The hubs rank above what they point at: they are what makes the pages
    // below reachable by anything other than this file.
    entry("/colleges", 0.9, "monthly"),
    entry("/comedk-rank", 0.9, "monthly"),
    entry("/comedk-cutoff", 0.9, "monthly"),

    ...RANK_BANDS.map((b) => entry(`/comedk-rank/${b.slug}`, 0.8, "monthly")),
    ...CITY_FACETS.map((c) =>
      entry(`/comedk-colleges-in/${c.slug}`, 0.8, "monthly"),
    ),
    ...BRANCH_FACETS.map((b) => entry(`/comedk-cutoff/${b.slug}`, 0.8, "monthly")),

    ...listColleges().map((c) => entry(`/college/${c.code}`, 0.7, "monthly")),
  ];
}
