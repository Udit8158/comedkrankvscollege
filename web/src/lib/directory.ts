import { listColleges, type CollegeMeta } from "./colleges";
import { getCollegeRecords } from "./college-records";
import {
  REGION_IDS,
  regionIdForCity,
  regionLabel,
  type RegionId,
} from "./locations";

/**
 * The college directory — the browsable index behind `/colleges`.
 *
 * Why this exists next to `locations.ts` rather than inside it: the location
 * filter builds its chips from colleges that have Round 3 GM cut-offs, because
 * a chip that can only ever read `0` tells a student nothing. The directory
 * needs the opposite rule. All 150 colleges carry researched metadata, and a
 * page nothing links to is a page that may as well not exist — so every
 * college appears here, and the 39 without cut-offs say so plainly instead of
 * being hidden.
 */

/** A college plus the few facts the directory row shows. */
export type DirectoryEntry = {
  college: CollegeMeta;
  /** Lowest recorded cut-off at this college — its rough standing. */
  benchmark: number | null;
  /** How many branches had a Round 3 GM cut-off. */
  branchCount: number;
};

export type DirectoryRegion = {
  id: RegionId;
  label: string;
  entries: DirectoryEntry[];
};

function entryFor(college: CollegeMeta): DirectoryEntry {
  const records = getCollegeRecords(college.code);
  // Records arrive sorted by family then cut-off, so the lowest number is not
  // necessarily first — a pure-CS seat sorts ahead of a cheaper core one.
  let benchmark: number | null = null;
  for (const r of records) {
    if (benchmark === null || r.cutoff < benchmark) benchmark = r.cutoff;
  }
  return { college, benchmark, branchCount: records.length };
}

const ENTRIES: DirectoryEntry[] = listColleges().map(entryFor);

const BY_CODE = new Map(ENTRIES.map((e) => [e.college.code, e]));

/**
 * Every college, grouped by region, in display order.
 *
 * Within a region, colleges sort by benchmark ascending — the hardest seat
 * first, which is the order a student reads a list of colleges in. Those with
 * no cut-off at all sort last rather than being dropped; they are still real
 * colleges with real metadata, and the empty state says why the column is
 * blank.
 */
export function directoryRegions(): DirectoryRegion[] {
  const byRegion = new Map<RegionId, DirectoryEntry[]>();

  for (const entry of ENTRIES) {
    const id = regionIdForCity(entry.college.city) ?? "other";
    const bucket = byRegion.get(id);
    if (bucket) bucket.push(entry);
    else byRegion.set(id, [entry]);
  }

  const out: DirectoryRegion[] = [];
  for (const id of REGION_IDS) {
    const entries = byRegion.get(id);
    if (!entries || entries.length === 0) continue;
    entries.sort(byBenchmarkThenName);
    out.push({ id, label: regionLabel(id), entries });
  }
  return out;
}

function byBenchmarkThenName(a: DirectoryEntry, b: DirectoryEntry): number {
  if (a.benchmark === null && b.benchmark === null) {
    return a.college.name.localeCompare(b.college.name);
  }
  if (a.benchmark === null) return 1;
  if (b.benchmark === null) return -1;
  return a.benchmark - b.benchmark;
}

/** Total colleges in the directory — every row, cut-offs or not. */
export const DIRECTORY_TOTAL = ENTRIES.length;

/** Colleges with at least one Round 3 GM cut-off. */
export const DIRECTORY_WITH_CUTOFFS = ENTRIES.filter(
  (e) => e.benchmark !== null,
).length;

/**
 * The colleges a student looking at this one would want next: same city,
 * nearest standing.
 *
 * City before rank on purpose. A student reading about a college in Mysuru is
 * usually deciding about Mysuru; handing them a Bengaluru college with a
 * similar cut-off answers a question they did not ask. When the city is too
 * small to fill the list, the region backfills it, and the region is named in
 * the UI so the widening is visible rather than silent.
 */
export function relatedColleges(
  code: string,
  limit = 6,
): { entries: DirectoryEntry[]; scope: "city" | "region" | null } {
  const self = BY_CODE.get(code);
  if (!self) return { entries: [], scope: null };

  const near = (pool: DirectoryEntry[]) => {
    // Distance in benchmark. A college with no cut-off has no standing to
    // compare, so it sorts to the back rather than pretending to be a match.
    const ref = self.benchmark;
    return [...pool].sort((a, b) => {
      if (ref === null) return byBenchmarkThenName(a, b);
      if (a.benchmark === null && b.benchmark === null) return 0;
      if (a.benchmark === null) return 1;
      if (b.benchmark === null) return -1;
      return Math.abs(a.benchmark - ref) - Math.abs(b.benchmark - ref);
    });
  };

  const others = ENTRIES.filter((e) => e.college.code !== code);

  if (self.college.city) {
    const sameCity = others.filter((e) => e.college.city === self.college.city);
    if (sameCity.length >= limit) {
      return { entries: near(sameCity).slice(0, limit), scope: "city" };
    }
  }

  const selfRegion = regionIdForCity(self.college.city);
  if (selfRegion) {
    const sameRegion = others.filter(
      (e) => regionIdForCity(e.college.city) === selfRegion,
    );
    if (sameRegion.length > 0) {
      return { entries: near(sameRegion).slice(0, limit), scope: "region" };
    }
  }

  return { entries: [], scope: null };
}

/** Directory entry for one college, for pages that already have the code. */
export function directoryEntry(code: string): DirectoryEntry | undefined {
  return BY_CODE.get(code);
}

/**
 * The colleges with the hardest seats, best first.
 *
 * Used as the home page's starting list. Ranked by benchmark rather than by a
 * hand-kept "tier" column on purpose — an editorial list is one more thing to
 * maintain and defend, and the data already sorts RVCE, MSRIT, BMSCE, SJCE and
 * DSCE to the top on its own. Colleges with no Round 3 record are excluded
 * here: this list is an answer to "which are the big ones", and a blank column
 * is not an answer to that question.
 */
export function topColleges(limit = 20): DirectoryEntry[] {
  return ENTRIES.filter((e) => e.benchmark !== null)
    .sort(byBenchmarkThenName)
    .slice(0, limit);
}
