import raw from "@/data.json";
import { cleanBranchName, familyOf } from "./branches";
import { getCollege, listColleges } from "./colleges";
import { directoryEntry, type DirectoryEntry } from "./directory";
import { slugify } from "./locations";

const data = raw as {
  branches: { code: string; name: string }[];
  records: { college: string; branch: string; rank: number }[];
};

/**
 * The two other shapes a student searches in: a place, and a branch.
 *
 * "comedk colleges in bangalore" and "comedk cutoff for cse" are both high
 * intent and neither had a URL. Both are generated from data already in the
 * repo — this module only decides *which* of them deserve a page.
 *
 * That decision is the point. Every city and every branch code could have one,
 * and the result would be thirty near-empty pages that make the site look like
 * a content farm. A facet earns a page when it has enough behind it to answer
 * the question it is named after; below the threshold, the college directory
 * and the predictor already serve the reader better.
 */

/** A city needs this many colleges with cut-offs before it gets a page. */
const MIN_COLLEGES_PER_CITY = 6;
/** A branch needs this many recorded cut-offs before it gets a page. */
const MIN_RECORDS_PER_BRANCH = 8;

const CODES_WITH_RECORDS = new Set(data.records.map((r) => r.college));

export type CityFacet = {
  slug: string;
  /** Canonical spelling as it appears in the CSV, e.g. "Bengaluru". */
  city: string;
  entries: DirectoryEntry[];
};

function buildCities(): CityFacet[] {
  const byCity = new Map<string, DirectoryEntry[]>();

  for (const college of listColleges()) {
    if (!college.city) continue;
    // A page titled "COMEDK colleges in X" that lists colleges with no Round 3
    // cut-off would not answer its own question.
    if (!CODES_WITH_RECORDS.has(college.code)) continue;
    const entry = directoryEntry(college.code);
    if (!entry) continue;
    const bucket = byCity.get(college.city);
    if (bucket) bucket.push(entry);
    else byCity.set(college.city, [entry]);
  }

  const out: CityFacet[] = [];
  for (const [city, entries] of byCity) {
    if (entries.length < MIN_COLLEGES_PER_CITY) continue;
    entries.sort((a, b) => (a.benchmark ?? Infinity) - (b.benchmark ?? Infinity));
    out.push({ slug: slugify(city), city, entries });
  }
  return out.sort((a, b) => b.entries.length - a.entries.length);
}

export const CITY_FACETS: CityFacet[] = buildCities();

export function cityFacetBySlug(slug: string): CityFacet | undefined {
  return CITY_FACETS.find((c) => c.slug === slug);
}

/** One college's cut-off in a specific branch. */
export type BranchSeat = {
  collegeCode: string;
  collegeName: string;
  place: string;
  cutoff: number;
};

export type BranchFacet = {
  slug: string;
  /** COMEDK's branch code, e.g. "CS". */
  code: string;
  /** Cleaned display name, e.g. "Computer Science & Engineering". */
  name: string;
  seats: BranchSeat[];
};

/**
 * URL names for the branches that get a page.
 *
 * Derived slugs were unusable here. COMEDK's own branch names produce
 * `computer-science-engineering-artificial-intelligence-machine-learning`
 * next to `artificial-intelligence-machine-learning` — two different branches
 * whose URLs differ by a prefix nobody would notice — and the IoT one ran past
 * seventy characters. These are what a student types instead.
 *
 * A branch that crosses the threshold later without an entry here falls back
 * to its derived slug, so new data adds a page rather than breaking the build.
 */
const BRANCH_SLUGS: Record<string, string> = {
  CS: "cse",
  EC: "ece",
  AI: "ai-ml",
  CI: "cse-ai-ml",
  CD: "cse-data-science",
  IS: "information-science",
  ME: "mechanical",
  EE: "electrical",
  CV: "civil",
  AD: "ai-data-science",
  IC: "cse-iot-cyber-security",
  CY: "cse-cyber-security",
  BT: "biotechnology",
  RI: "robotics-ai",
};

function buildBranches(): BranchFacet[] {
  const byBranch = new Map<string, BranchSeat[]>();

  for (const r of data.records) {
    // Design and planning programmes sit outside the predictor's scope, and a
    // page for them here would contradict the tool next to it.
    if (familyOf(r.branch) === null) continue;
    const college = getCollege(r.college);
    if (!college) continue;
    const seat: BranchSeat = {
      collegeCode: r.college,
      collegeName: college.name,
      place: [college.locality, college.city].filter(Boolean).join(" · "),
      cutoff: r.rank,
    };
    const bucket = byBranch.get(r.branch);
    if (bucket) bucket.push(seat);
    else byBranch.set(r.branch, [seat]);
  }

  const nameByCode = new Map(
    data.branches.map((b) => [b.code, cleanBranchName(b.name)]),
  );

  const out: BranchFacet[] = [];
  for (const [code, seats] of byBranch) {
    if (seats.length < MIN_RECORDS_PER_BRANCH) continue;
    seats.sort((a, b) => a.cutoff - b.cutoff);
    const name = nameByCode.get(code) ?? code;
    out.push({ slug: BRANCH_SLUGS[code] ?? slugify(name), code, name, seats });
  }
  return out.sort((a, b) => b.seats.length - a.seats.length);
}

export const BRANCH_FACETS: BranchFacet[] = buildBranches();

export function branchFacetBySlug(slug: string): BranchFacet | undefined {
  return BRANCH_FACETS.find((b) => b.slug === slug);
}
