import raw from "@/data.json";
import { formatRank } from "./utils";

const data = raw as { records: { rank: number }[] };

/** The highest rank that got a Round 3 GM seat anywhere. */
export const MAX_CUTOFF = data.records.reduce(
  (max, r) => (r.rank > max ? r.rank : max),
  0,
);

/**
 * Rank bands — the shape of "comedk rank 15000 which college", which is how
 * students actually search and which the tool has never had a URL for.
 *
 * Nine bands, not ninety. The boundaries sit where the answer genuinely
 * changes: 111 colleges are reachable at 1,000 and 69 at a lakh, and the
 * interesting movement is in between. Slicing that into 1,000-rank steps would
 * produce ninety pages differing by a row or two, which is the definition of a
 * doorway cluster — and the judgement lands on the whole site, not just the
 * thin pages.
 *
 * Each band is computed at its **upper** bound, the worst rank in it. That is
 * the honest reading: everything the page lists is reachable by everyone the
 * page is for. A student at 10,500 looking at the 10,000–20,000 page sees a
 * floor, never a promise they cannot keep.
 */
export type RankBand = {
  /** URL segment, e.g. "10000-20000". */
  slug: string;
  from: number;
  /** `null` on the open-ended top band. */
  to: number | null;
  /** "10,000 – 20,000" */
  label: string;
  /** The rank the list is computed at — always the worst case in the band. */
  reference: number;
};

const BOUNDS: Array<[number, number | null]> = [
  [1, 1000],
  [1000, 5000],
  [5000, 10000],
  [10000, 20000],
  [20000, 35000],
  [35000, 50000],
  [50000, 75000],
  [75000, 100000],
  [100000, null],
];

function slugFor(from: number, to: number | null): string {
  if (to === null) return `above-${from}`;
  if (from <= 1) return `under-${to}`;
  return `${from}-${to}`;
}

function labelFor(from: number, to: number | null): string {
  if (to === null) return `above ${formatRank(from)}`;
  if (from <= 1) return `under ${formatRank(to)}`;
  return `${formatRank(from)} – ${formatRank(to)}`;
}

export const RANK_BANDS: RankBand[] = BOUNDS.map(([from, to]) => ({
  slug: slugFor(from, to),
  from,
  to,
  label: labelFor(from, to),
  // The open-ended band is computed at the highest cut-off in the data: past
  // that point no Round 3 GM seat was allotted at all, which is a real answer
  // and one the page says out loud.
  reference: to ?? MAX_CUTOFF,
}));

export function bandBySlug(slug: string): RankBand | undefined {
  return RANK_BANDS.find((b) => b.slug === slug);
}

/** The band a given rank falls into — used to cross-link from the predictor. */
export function bandForRank(rank: number): RankBand | undefined {
  return RANK_BANDS.find((b) => rank >= b.from && (b.to === null || rank <= b.to));
}

/** Previous and next band, for walking the set. */
export function bandNeighbours(band: RankBand): {
  prev?: RankBand;
  next?: RankBand;
} {
  const i = RANK_BANDS.findIndex((b) => b.slug === band.slug);
  return {
    prev: i > 0 ? RANK_BANDS[i - 1] : undefined,
    next: i < RANK_BANDS.length - 1 ? RANK_BANDS[i + 1] : undefined,
  };
}
