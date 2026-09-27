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
  // "& around" is load-bearing: the region holds Bengaluru Rural and
  // Chikkaballapur too, and a region that shares its name with a city inside
  // it reads as the same word nested in itself.
  bengaluru: "Bengaluru & around",
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

/* ── Inside Bengaluru: sides, not cities ─────────────────────────────────
 *
 * Everywhere else the second tier is a list of cities, because they *are*
 * different cities — Mysuru is not Hassan. Bengaluru is the exception: the
 * region splits 59 / 4 / 1 into Bengaluru, Bengaluru Rural and Chikkaballapur,
 * so offering that split asks a student to choose between "Bengaluru" and
 * "Bengaluru" and hands them almost nothing for the trouble.
 *
 * The question a Bengaluru student actually asks is which side of the city,
 * and the localities already in colleges.csv answer it. This table is local
 * knowledge, not an official boundary — the compass points are how the city is
 * spoken about, and edge cases (Anekal, Mahalakshmipuram) are judgement calls
 * that are meant to be argued with and edited.
 */
type Side = "north" | "east" | "south" | "west" | "outskirts";

const SIDE_META: Record<Side, { label: string; phrase: string }> = {
  north: { label: "North", phrase: "north Bengaluru" },
  east: { label: "East", phrase: "east Bengaluru" },
  south: { label: "South", phrase: "south Bengaluru" },
  west: { label: "West", phrase: "west Bengaluru" },
  // Not a compass point but the distinction students care about most: these
  // are hostel-or-two-hour-commute campuses, not somewhere you live at home.
  outskirts: { label: "Outskirts", phrase: "the Bengaluru outskirts" },
};

const SIDE_ORDER: Side[] = ["north", "east", "south", "west", "outskirts"];

/** Keyed by locality, lower-cased with "rd" spelled out and spacing collapsed. */
const SIDE_BY_LOCALITY: Record<string, Side> = {
  // North — the Yelahanka/Hebbal/Jalahalli arc.
  yelahanka: "north",
  hebbal: "north",
  "jalahalli east": "north",
  "msr nagar": "north",
  "r t nagar post": "north",
  "rajan kunte": "north",
  "hesarghatta main road": "north",
  soladevanahalli: "north",
  kothanur: "north",

  // East — Old Madras Road out to Whitefield.
  avalahalli: "east",
  brookefield: "east",
  whitefield: "east",
  "k r puram": "east",
  "old madras road": "east",

  // South — Jayanagar/Basavanagudi down Bannerghatta and Kanakapura Roads.
  banashankari: "south",
  "bannerghatta road": "south",
  basavanagudi: "south",
  "chikkanayakanahalli dinne": "south",
  doddakalasandra: "south",
  "j p nagar": "south",
  jayanagar: "south",
  "kanakapura main road": "south",
  "kanakapura road": "south",
  "off kanakapura road": "south",
  koramangala: "south",
  "kumaraswamy layout": "south",
  tathguni: "south",
  "v v puram": "south",

  // West — Mysore Road, Kengeri, RR Nagar, Magadi Road.
  "bel layout": "west",
  "kambipura mysore road": "west",
  kengeri: "west",
  "kengeri main road": "west",
  kumbalgodu: "west",
  mahalaxmipuram: "west",
  malathahalli: "west",
  "mysore road": "west",
  "r r nagar post": "west",
  "rajarajeshwari nagar": "west",

  // Outskirts — outside the city proper, even where the address still says
  // "Bengaluru": the airport belt, Anekal, and the Doddaballapur side.
  anekal: "outskirts",
  "bagalur-chagalatti": "outskirts",
  devanahalli: "outskirts",
  "dodaballapur taluk": "outskirts",
  "kial road": "outskirts",
  kundana: "outskirts",
  sadahalli: "outskirts",
};

function normalizeLocality(s: string): string {
  return s
    .toLowerCase()
    .replace(/\brd\b/g, "road")
    .replace(/\s+/g, " ")
    .trim();
}

function sideOf(locality: string | undefined, city: string): Side | null {
  // Bengaluru Rural and Chikkaballapur are outside the city by definition, so
  // they need no locality lookup at all.
  if (city !== "Bengaluru") return "outskirts";
  return SIDE_BY_LOCALITY[normalizeLocality(locality ?? "")] ?? null;
}

/**
 * Bucket for a Bengaluru locality the table above has never heard of. It is
 * empty today and should stay that way: guessing a side would be a claim the
 * data does not support, and silently dropping the college would hide it from
 * every side at once. So it surfaces as its own chip — visibly odd, which is
 * exactly the prompt to come and add the locality here.
 */
const UNPLACED = "unplaced";

export function canonicalCity(raw?: string): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  return CITY_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

/**
 * Region a city belongs to, or `null` when the row carries no city at all.
 *
 * `REGIONS` below deliberately excludes colleges with no Round 3 GM record,
 * because a filter chip that can only ever read `0` is noise. The directory
 * has the opposite requirement — every college needs a page it can be reached
 * from, cut-offs or not — so it maps colleges to regions through this instead
 * of through the buckets, and the city→region knowledge stays in one file.
 */
export function regionIdForCity(raw?: string): RegionId | null {
  const city = canonicalCity(raw);
  if (!city) return null;
  return REGION_OF_CITY[city] ?? "other";
}

/** Display label for a region id. */
export function regionLabel(id: RegionId): string {
  return REGION_LABEL[id];
}

/** Region ids in display order — biggest and best-known first. */
export const REGION_IDS: readonly RegionId[] = REGION_ORDER;

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** One selectable subdivision of a region — a city, or a side of Bengaluru. */
export type Area = {
  /** URL-safe id, unique within its region. */
  slug: string;
  /** Chip text. */
  label: string;
  /** How it reads mid-sentence: "22 found in …", "Nothing in … at rank …". */
  phrase: string;
  codes: string[];
};

export type Region = {
  id: RegionId;
  label: string;
  /** Every college code in the region, all areas included. */
  codes: string[];
  areas: Area[];
};

function build(): Region[] {
  const byRegion = new Map<RegionId, Map<string, { label: string; phrase: string; codes: string[] }>>();
  // Kept alongside the area buckets because a college can belong to a region
  // and to no area within it (an unmapped Bengaluru locality) — it must still
  // be reachable from the region chip.
  const regionCodes = new Map<RegionId, string[]>();

  for (const c of listColleges()) {
    // Bidar and Kalaburagi have colleges but no Round 3 GM cut-offs, so a chip
    // for them could only ever read "0" at every rank. A permanently empty
    // filter is noise, not information — the zero state is reserved for
    // "nothing here *at your rank*", which is a real answer.
    if (!COLLEGE_CODES_WITH_RECORDS.has(c.code)) continue;
    const city = canonicalCity(c.city);
    if (!city) continue; // no city on the row — it can only be reached via "anywhere"
    const region = REGION_OF_CITY[city] ?? "other";
    const all = regionCodes.get(region);
    if (all) all.push(c.code);
    else regionCodes.set(region, [c.code]);

    let areas = byRegion.get(region);
    if (!areas) byRegion.set(region, (areas = new Map()));

    // Bengaluru subdivides by side of the city; every other region by city.
    let key: string, label: string, phrase: string;
    if (region === "bengaluru") {
      const side = sideOf(c.locality, city);
      key = side ?? UNPLACED;
      label = side ? SIDE_META[side].label : "Elsewhere in the city";
      phrase = side ? SIDE_META[side].phrase : "Bengaluru";
    } else {
      key = city;
      label = city;
      phrase = city;
    }

    const bucket = areas.get(key);
    if (bucket) bucket.codes.push(c.code);
    else areas.set(key, { label, phrase, codes: [c.code] });
  }

  const regions: Region[] = [];
  for (const id of REGION_ORDER) {
    const areas = byRegion.get(id);
    if (!areas || areas.size === 0) continue;
    const buckets: Area[] = [...areas.entries()].map(([key, a]) => ({
      slug: slugify(key),
      label: a.label,
      phrase: a.phrase,
      codes: a.codes,
    }));
    // Sides read in compass order — a row that reshuffles itself as the rank
    // changes is harder to re-find than one that never moves. Cities have no
    // natural order, so the biggest goes first.
    if (id === "bengaluru") {
      // Anything unplaced sorts last (indexOf → -1 would put it first).
      const rank = (slug: string) => {
        const i = SIDE_ORDER.indexOf(slug as Side);
        return i === -1 ? SIDE_ORDER.length : i;
      };
      buckets.sort((a, b) => rank(a.slug) - rank(b.slug));
    } else {
      buckets.sort((a, b) => b.codes.length - a.codes.length || a.label.localeCompare(b.label));
    }

    regions.push({
      id,
      label: REGION_LABEL[id],
      codes: regionCodes.get(id) ?? [],
      areas: buckets,
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

export function areaBySlug(
  region: Region | undefined,
  slug: string | null | undefined,
): Area | undefined {
  if (!region || !slug) return undefined;
  return region.areas.find((a) => a.slug === slug);
}

/**
 * The college codes a (region, area) selection allows — or null for "anywhere",
 * which callers treat as "no filter" rather than "empty set".
 */
export function codesFor(
  regionId: string | null,
  areaSlug: string | null,
): ReadonlySet<string> | null {
  const region = regionById(regionId);
  if (!region) return null;
  const area = areaBySlug(region, areaSlug);
  return new Set(area ? area.codes : region.codes);
}

/**
 * How the selection reads mid-sentence — "22 found in *north Bengaluru*",
 * "Nothing in *Mysuru* at rank 45,000". Null when nothing is selected.
 */
export function placePhrase(
  regionId: string | null,
  areaSlug: string | null,
): string | null {
  const region = regionById(regionId);
  if (!region) return null;
  return areaBySlug(region, areaSlug)?.phrase ?? region.label;
}
