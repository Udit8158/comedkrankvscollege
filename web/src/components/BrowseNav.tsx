import Link from "next/link";
import { CITY_FACETS, BRANCH_FACETS } from "@/lib/facets";
import { RANK_BANDS } from "@/lib/rank-bands";
import { DIRECTORY_TOTAL } from "@/lib/directory";

/**
 * The three other ways into the same data — by rank band, by branch, by city.
 *
 * It exists because the generated pages would otherwise repeat the mistake
 * they were built to fix: a page reachable only from the sitemap is a page a
 * crawler has no reason to rate, and a reader never finds at all. Every hub
 * gets a link from the home page and from the directory, and the hubs link to
 * each other from inside.
 *
 * Deliberately a plain list of links, not chips. The location filter already
 * owns the chip vocabulary on this page, and a second row of them would read
 * as another control on the tool rather than as navigation away from it.
 */
export function BrowseNav() {
  const groups = [
    {
      eyebrow: "by rank",
      href: "/comedk-rank",
      lead: "What a rank band reaches",
      items: RANK_BANDS.slice(0, 5).map((b) => ({
        label: b.label,
        href: `/comedk-rank/${b.slug}`,
      })),
      all: { label: `all ${RANK_BANDS.length} bands`, href: "/comedk-rank" },
    },
    {
      eyebrow: "by branch",
      href: "/comedk-cutoff",
      lead: "Closing ranks for one branch",
      items: BRANCH_FACETS.slice(0, 5).map((b) => ({
        label: b.code,
        href: `/comedk-cutoff/${b.slug}`,
      })),
      all: {
        label: `all ${BRANCH_FACETS.length} branches`,
        href: "/comedk-cutoff",
      },
    },
    {
      eyebrow: "by city",
      href: "/colleges",
      lead: "Colleges in one place",
      items: CITY_FACETS.map((c) => ({
        label: c.city,
        href: `/comedk-colleges-in/${c.slug}`,
      })),
      all: { label: `all ${DIRECTORY_TOTAL} colleges`, href: "/colleges" },
    },
  ];

  return (
    <section className="mt-24 border-t border-hairline pt-8">
      <p className="eyebrow">other ways in</p>
      <div className="mt-6 grid gap-10 sm:grid-cols-3">
        {groups.map((g) => (
          <div key={g.eyebrow}>
            <h3 className="text-[15px] text-fg leading-snug">
              <Link href={g.href} className="linkmark">
                {g.lead}
              </Link>
            </h3>
            <ul className="mt-3 flex flex-col gap-1.5 font-mono text-[12px] tracking-wider">
              {g.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="linkmark text-fg-mute">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link href={g.all.href} className="linkmark text-fg-dim">
                  {g.all.label} →
                </Link>
              </li>
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
