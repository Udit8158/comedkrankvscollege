import type { MetadataRoute } from "next";
import { listColleges } from "@/lib/colleges";
import { SITE_URL } from "@/lib/site";

/**
 * When the underlying cut-off data was published by COMEDK.
 *
 * Not `new Date()`. A sitemap that stamps every URL with the build time claims
 * all 151 pages changed whenever the site was redeployed, which is false for
 * almost all of them — and a `lastmod` a crawler catches lying is a `lastmod`
 * it learns to ignore. This is the date the numbers on these pages actually
 * come from, so it moves when they do.
 *
 * Update this alongside `data.json` when a new year's PDF lands.
 */
const DATA_PUBLISHED = new Date("2025-08-22T00:00:00Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: DATA_PUBLISHED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      // The directory is what makes the 150 below reachable by anything other
      // than this file, so it ranks above them in priority.
      url: `${SITE_URL}/colleges`,
      lastModified: DATA_PUBLISHED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...listColleges().map((c) => ({
      url: `${SITE_URL}/college/${c.code}`,
      lastModified: DATA_PUBLISHED,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
