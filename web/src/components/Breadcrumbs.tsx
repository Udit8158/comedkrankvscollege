import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export type Crumb = {
  label: string;
  /** Absent on the last crumb — the page you are already on. */
  href?: string;
};

/**
 * The trail, and the machine-readable copy of it.
 *
 * Two jobs in one component on purpose: a breadcrumb that renders but emits no
 * `BreadcrumbList` is a missed SERP treatment, and one that emits schema it
 * does not render is the kind of mismatch Google penalises. Keeping both here
 * means they cannot drift apart.
 *
 * It replaces the bare "← back to predictor" link on college pages, which told
 * the browser's back button what it already knew and told a crawler nothing
 * about where the page sat.
 */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[12px] tracking-wider text-fg-mute">
        {trail.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-baseline gap-2">
            {i > 0 && (
              <span aria-hidden="true" className="text-fg-dim">
                /
              </span>
            )}
            {c.href ? (
              <Link href={c.href} className="linkmark">
                {c.label}
              </Link>
            ) : (
              <span className="text-fg-dim">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
