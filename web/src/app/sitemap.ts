import type { MetadataRoute } from "next";
import { listColleges } from "@/lib/colleges";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    ...listColleges().map((c) => ({
      url: `${SITE_URL}/college/${c.code}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
