import Link from "next/link";
import { CollegeRow } from "@/components/CollegeRow";
import { relatedColleges } from "@/lib/directory";

/**
 * "If you are looking at this one, you are probably weighing these."
 *
 * Same city first, nearest cut-off within it — because a student reading about
 * a college in Mysuru is usually deciding about Mysuru, and a Bengaluru
 * college with a similar rank answers a question they did not ask. The heading
 * names the scope, so when a small city forces the net wider the widening is
 * visible rather than silent.
 */
export function RelatedColleges({
  code,
  city,
  rank,
}: {
  code: string;
  city?: string;
  rank?: number;
}) {
  const { entries, scope } = relatedColleges(code);
  if (entries.length === 0) return null;

  const where = scope === "city" && city ? city : "the same region";

  return (
    <section className="mt-20">
      <div className="flex items-baseline justify-between border-b border-hairline pb-3">
        <h2 className="eyebrow">also in {where}</h2>
        <Link
          href="/colleges"
          className="linkmark font-mono text-[12px] text-fg-mute tracking-wider"
        >
          all colleges →
        </Link>
      </div>
      <div>
        {entries.map((entry) => (
          <CollegeRow key={entry.college.code} entry={entry} rank={rank} />
        ))}
      </div>
    </section>
  );
}
