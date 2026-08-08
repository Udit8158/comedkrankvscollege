// Where the colleges are.
//
// The CSV carries a free-text `city` per college. That is the right shape for
// the data (it is what the college's own address says) and the wrong shape for
// a filter: 32 distinct values, twenty of which have a single college, is a
// chip row nobody reads. So this module does two things on top of the raw
// field:
//
//   1. Canonicalises spelling. The CSV has been cleaned, but a new row typed
//      as "Bangalore" or "Mysore" should not silently open a 33rd bucket. The
//      alias table is the safety net for that, not the current state of the
//      data.
//   2. Rolls cities up into six regions a student would actually say out loud.
//      Bengaluru is one answer; "Belagavi, Hubballi, Dharwad, Gadag…" is one
//      answer too, and it is "north Karnataka".
//
// Both levels are selectable — region first, then the cities inside it — so a
// student in Mysuru is two clicks from a Mysuru-only list without anyone in
// Bengaluru having to scroll past thirty place names to get there.

import { listColleges } from "./colleges";
import { COLLEGE_CODES_WITH_RECORDS } from "./predict";

export type RegionId =
  | "bengaluru"
  | "mysuru"
  | "coastal"
  | "central"
  | "north"
  | "kalyana"
  | "other";

/** Spelling variants → the name used in the CSV. Keys are lower-cased. */
const CITY_ALIASES: Record<string, string> = {
  bangalore: "Bengaluru",
  "bengaluru urban": "Bengaluru",
  "bangalore urban": "Bengaluru",
  "bangalore rural": "Bengaluru Rural",
  mysore: "Mysuru",
  mangalore: "Mangaluru",
  belgaum: "Belagavi",
  hubli: "Hubballi",
  "hubli-dharwad": "Hubballi",
  tumkur: "Tumakuru",
  gulbarga: "Kalaburagi",
  kalaburgi: "Kalaburagi",
  bellary: "Ballari",
  bijapur: "Vijayapura",
  bagalkot: "Bagalkote",
  "dakshin kannada": "Dakshina Kannada",
  "dakshina kannada district": "Dakshina Kannada",
  "mandya district": "Mandya",
  shimoga: "Shivamogga",
  hospet: "Hosapete",
  chikmagalur: "Chikkamagaluru",
  chickmagalur: "Chikkamagaluru",
  chickballapur: "Chikkaballapur",
  chikballapur: "Chikkaballapur",
  davanagere: "Davangere",
  kodagu: "South Kodagu",
  coorg: "South Kodagu",
};

/**
 * City → region. Everything absent from this map lands in `other`, which is
 * why the fallback exists rather than a `never`-typed exhaustive record: a new
 * COMEDK college in a town nobody listed here still shows up under "elsewhere"
 * instead of vanishing from the filter.
 *
 * The groupings follow how students talk about the state, which is close to —
 * but not identical with — Karnataka's revenue divisions. The coast is split
 * out of the Mysuru division on purpose: Mangaluru, Udupi and Moodbidri are a
 * destination of their own in this decision, not a suburb of Mysuru.
 */
const REGION_OF_CITY: Record<string, RegionId> = {
  // Bengaluru and the belt that commutes into it.
  Bengaluru: "bengaluru",
  "Bengaluru Rural": "bengaluru",
  Doddaballapur: "bengaluru",
  Chikkaballapur: "bengaluru",
  Kolar: "bengaluru",

  // Old Mysuru.
  Mysuru: "mysuru",
  Mandya: "mysuru",
  Hassan: "mysuru",
  Chikkamagaluru: "mysuru",
  "South Kodagu": "mysuru",

  // Coastal.
  Mangaluru: "coastal",
  Udupi: "coastal",
  "Dakshina Kannada": "coastal",

  // Central / Malnad.
  Tumakuru: "central",
  Tiptur: "central",
  Davangere: "central",
  Shivamogga: "central",
  Chitradurga: "central",

  // Bombay Karnataka.
  Belagavi: "north",
  Hubballi: "north",
  Dharwad: "north",
  Bagalkote: "north",
  Vijayapura: "north",
  Gadag: "north",
  Haliyal: "north",
  Ranebennur: "north",

  // Kalyana Karnataka.
  Kalaburagi: "kalyana",
  Bidar: "kalyana",
  Ballari: "kalyana",
  Raichur: "kalyana",
  Yadgir: "kalyana",
  Hosapete: "kalyana",
};

const REGION_LABEL: Record<RegionId, string> = {
  bengaluru: "Bengaluru",
  mysuru: "Mysuru & around",
  coastal: "Coastal",
  central: "Central",
  north: "North Karnataka",
  kalyana: "Kalyana Karnataka",
  other: "Elsewhere",
};

/** Bengaluru first because two-thirds of the list is there; `other` last. */
const REGION_ORDER: RegionId[] = [
  "bengaluru",
  "mysuru",
  "coastal",
  "central",
  "north",
  "kalyana",
  "other",
];

export function canonicalCity(raw?: string): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  return CITY_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type CityBucket = {
  /** URL-safe id, unique within its region. */
  slug: string;
  name: string;
  codes: string[];
};

export type Region = {
  id: RegionId;
  label: string;
  /** Every college code in the region, cities included. */
  codes: string[];
  /** Cities inside it, largest first. */
  cities: CityBucket[];
};

function build(): Region[] {
  const byRegion = new Map<RegionId, Map<string, string[]>>();

  for (const c of listColleges()) {
    // Bidar and Kalaburagi have colleges but no Round 3 GM cut-offs, so a chip
    // for them could only ever read "0" at every rank. A permanently empty
    // filter is noise, not information — the zero state is reserved for
    // "nothing here *at your rank*", which is a real answer.
    if (!COLLEGE_CODES_WITH_RECORDS.has(c.code)) continue;
    const city = canonicalCity(c.city);
    if (!city) continue; // no city on the row — it can only be reached via "anywhere"
    const region = REGION_OF_CITY[city] ?? "other";
    let cities = byRegion.get(region);
    if (!cities) byRegion.set(region, (cities = new Map()));
    const bucket = cities.get(city);
    if (bucket) bucket.push(c.code);
    else cities.set(city, [c.code]);
  }

  const regions: Region[] = [];
  for (const id of REGION_ORDER) {
    const cities = byRegion.get(id);
    if (!cities || cities.size === 0) continue;
    const buckets: CityBucket[] = [...cities.entries()]
      .map(([name, codes]) => ({ slug: slugify(name), name, codes }))
      .sort((a, b) => b.codes.length - a.codes.length || a.name.localeCompare(b.name));
    regions.push({
      id,
      label: REGION_LABEL[id],
      codes: buckets.flatMap((b) => b.codes),
      cities: buckets,
    });
  }
  return regions;
}

/** Regions that actually contain a college, in display order. */
export const REGIONS: Region[] = build();

export function regionById(id: string | null | undefined): Region | undefined {
  if (!id) return undefined;
  return REGIONS.find((r) => r.id === id);
}

export function cityBySlug(
  region: Region | undefined,
  slug: string | null | undefined,
): CityBucket | undefined {
  if (!region || !slug) return undefined;
  return region.cities.find((c) => c.slug === slug);
}

/**
 * The college codes a (region, city) selection allows — or null for "anywhere",
 * which callers treat as "no filter" rather than "empty set".
 */
export function codesFor(
  regionId: string | null,
  citySlug: string | null,
): ReadonlySet<string> | null {
  const region = regionById(regionId);
  if (!region) return null;
  const city = cityBySlug(region, citySlug);
  return new Set(city ? city.codes : region.codes);
}

/** "Bengaluru" / "Bengaluru Rural" / null when nothing is selected. */
export function placeLabel(
  regionId: string | null,
  citySlug: string | null,
): string | null {
  const region = regionById(regionId);
  if (!region) return null;
  return cityBySlug(region, citySlug)?.name ?? region.label;
}
