import Link from "next/link";
import { CollegeRow } from "@/components/CollegeRow";
import { DIRECTORY_TOTAL, topColleges } from "@/lib/directory";

/**
 * A way into the 150 college pages for the reader who has not typed a rank —
 * and the only reason a search engine has ever had to believe those pages
 * exist.
 *
 * It sits below the predictor, not inside it, and that placement is the whole
 * argument. The empty state's promise — nothing is predicted until a rank is
 * entered — is about *results*, and this is not results: it is the index,
 * reachable the way a contents page is reachable. Framing it as "or start from
 * the colleges" rather than as a default list of matches keeps the two
 * readings apart.
 */
export function StartingList() {
  const entries = topColleges(20);

  return (
    <section className="mt-24">
      <div className="flex items-baseline justify-between border-b border-hairline pb-3">
        <h2 className="eyebrow">or start from the colleges</h2>
        <Link
          href="/colleges"
          className="linkmark font-mono text-[12px] text-fg-mute tracking-wider"
        >
          all {DIRECTORY_TOTAL} →
        </Link>
      </div>

      <p className="mt-5 max-w-xl text-[14px] text-fg-mute leading-relaxed">
        The twenty colleges where the hardest seat went to the lowest rank, in
        the COMEDK 2025 Round 3 allotment. Each page carries every branch that
        college filled, its placement figures, and — for some — a student who
        studied there talking about it.
      </p>

      <div className="mt-6">
        {entries.map((entry) => (
          <CollegeRow key={entry.college.code} entry={entry} />
        ))}
      </div>
    </section>
  );
}
