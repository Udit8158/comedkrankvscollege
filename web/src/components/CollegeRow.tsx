import Link from "next/link";
import { formatRank } from "@/lib/utils";
import type { DirectoryEntry } from "@/lib/directory";

/**
 * One college in a browsable list — the directory, the related block, the
 * home page's starting list.
 *
 * Deliberately the same three-column shape as `ResultRow`: code, identity,
 * number. A student moving between the predictor's results and the directory
 * should not have to re-learn where to look. What differs is the number on the
 * right — a result row shows the cut-off of one branch against the student's
 * rank, this shows the college's lowest cut-off, which is the closest thing to
 * "how hard is it to get in here" the data can honestly say.
 */
export function CollegeRow({
  entry,
  rank,
}: {
  entry: DirectoryEntry;
  /** Carried into the link so the college page keeps the fit context. */
  rank?: number;
}) {
  const { college, benchmark, branchCount } = entry;
  const href = rank
    ? `/college/${college.code}?rank=${rank}`
    : `/college/${college.code}`;

  const place = [college.locality, college.city].filter(Boolean).join(" · ");
  const meta = [place, college.established ? `est. ${college.established}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={href}
      // The directory puts 150 of these on one page. Next's default would
      // prefetch every row that scrolls into view, which on a phone is a few
      // hundred KB of payload for a reader who will open one college. Hover
      // still warms the link, and the pages are small enough that a cold click
      // is not felt.
      prefetch={false}
      className="row block py-4 sm:grid sm:grid-cols-[64px_1fr_auto] sm:gap-x-5 group"
    >
      <div className="font-mono text-[11px] sm:text-[12px] tracking-wider text-fg-mute sm:pt-[3px] group-hover:text-accent transition-colors">
        {college.code}
      </div>

      <div className="min-w-0 mt-1 sm:mt-0">
        <div className="text-[15px] leading-snug text-fg">
          <span className="linkmark">{college.name}</span>
        </div>
        {meta && (
          <div className="text-[13px] text-fg-mute mt-0.5">{meta}</div>
        )}
      </div>

      {/* The right column is the college's standing. When there is no Round 3
          GM record at all, it says so rather than showing a dash a reader has
          to decode — and the row still links, because the page behind it has
          placement, founding year and a description worth reading. */}
      <div className="mt-3 sm:mt-0 flex items-baseline justify-between sm:block sm:text-right tabular-nums">
        {benchmark === null ? (
          <span className="font-mono text-[11px] text-fg-dim tracking-wider uppercase">
            no round 3 data
          </span>
        ) : (
          <>
            <span className="font-mono text-[15px] text-fg">
              {formatRank(benchmark)}
            </span>
            <span className="font-mono text-[11px] text-fg-dim tracking-wider sm:block sm:mt-1">
              {branchCount} {branchCount === 1 ? "branch" : "branches"}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
