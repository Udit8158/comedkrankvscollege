// Merges hand-curated college research into the CSV scaffold without
// touching pre-filled columns (code, name, locality, city, podcast).
// Sources column lists the domains I cross-checked.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, "..", "..", "plans", "demo_additional_data.csv");

// Research bank — keyed by college code. Only fields with a confident value
// are set. Where placement_year is omitted but a package figure exists, the
// figure is for 2024 (the most recent cycle reported across sources at the
// time of research, June 2026). Sources are domain shorthands.
const data = {
  // ── Tier 1: top engineering colleges by COMEDK cut-off / brand value ──
  E095: {
    established_year: 1963,
    type: "autonomous",
    website: "https://www.rvce.edu.in",
    placement_cse_avg_lpa: "",            // not split out in published data
    placement_overall_avg_lpa: 15.25,
    placement_year: 2024,
    about: "Top-tier private autonomous engineering college in Bengaluru; run by the Rashtriya Sikshana Samithi Trust; highly competitive admissions and placements.",
    sources: "rvce.edu.in; careers360.com; shiksha.com",
    confidence: "high",
  },
  E027: {
    established_year: 1946,
    type: "autonomous",
    website: "https://www.bmsce.ac.in",
    placement_cse_avg_lpa: 11,            // sources cluster around 8–13; 11 is mid-estimate
    placement_overall_avg_lpa: 9.8,
    placement_year: 2024,
    about: "India's first private engineering college; founded by BMS Educational Trust; strong legacy program with autonomous status.",
    sources: "bmsce.ac.in; careers360.com; collegedunia.com",
    confidence: "high",
    notes: "CSE average estimated from range across sources; cross-verify with NIRF data.",
  },
  E077: {
    established_year: 1962,
    type: "autonomous",
    website: "https://www.msrit.edu",
    placement_cse_avg_lpa: 11,
    placement_overall_avg_lpa: 10,
    placement_year: 2024,
    about: "Run by Gokula Education Foundation; one of Bengaluru's most-recruited colleges with strong industry connect.",
    sources: "msrit.edu; shiksha.com; careers360.com",
    confidence: "high",
  },
  E028: {
    established_year: 2002,
    type: "autonomous",
    website: "https://bmsit.ac.in",
    placement_overall_avg_lpa: 7.9,
    placement_year: 2024,
    about: "Yelahanka campus of the BMS Educational Trust; engineering and management programs with strong placement record.",
    sources: "bmsit.ac.in; careers360.com; shiksha.com",
    confidence: "high",
  },
  E040: {
    established_year: 1979,
    type: "autonomous",
    website: "https://www.dsce.edu.in",
    placement_overall_avg_lpa: 9,
    placement_year: 2024,
    about: "Flagship engineering college of the Dayananda Sagar group; autonomous since 2015; located at Kumaraswamy Layout.",
    sources: "dsce.edu.in; en.wikipedia.org; collegedunia.com",
    confidence: "medium",
    notes: "2024 avg figure from student-reviewed source; official avg not directly published.",
  },
  E019: {
    established_year: 1979,
    type: "autonomous",
    website: "https://bit-bangalore.edu.in",
    placement_overall_avg_lpa: 10,
    placement_year: 2024,
    about: "Run by the Vokkaligara Sangha; VV Puram campus; long-standing reputation in Bengaluru engineering circles.",
    sources: "bit-bangalore.edu.in; collegedunia.com; en.wikipedia.org",
    confidence: "medium",
    notes: "2024 official average not formally released by college; figure from aggregator estimates.",
  },
  E125: {
    established_year: 1963,
    type: "autonomous",
    website: "https://sit.ac.in",
    placement_overall_avg_lpa: 8.5,
    placement_year: 2024,
    about: "Run by Sri Siddaganga Education Society; autonomous; one of Tumakuru's leading engineering institutions.",
    sources: "sit.ac.in; careers360.com; shiksha.com",
    confidence: "high",
  },
  E061: {
    established_year: 1963,            // SJCE founded 1963; JSSSTU constituent since 2016-17
    type: "university",
    website: "https://jssstuniv.in",
    placement_cse_avg_lpa: 10,
    placement_overall_avg_lpa: 6.5,
    placement_year: 2024,
    about: "Constituent college of JSS Science and Technology University (formerly SJCE Mysuru); autonomous since 2007-08.",
    sources: "jssstuniv.in; careers360.com; comedk.org",
    confidence: "high",
    notes: "Same campus as SJCE. JSSSTU itself founded 2016-17; underlying SJCE since 1963.",
  },
  E085: {
    established_year: 1946,
    type: "autonomous",
    website: "https://nie.ac.in",
    placement_overall_avg_lpa: 10.5,
    placement_year: 2024,
    about: "North campus of The National Institute of Engineering, Mysuru; autonomous under VTU since 2007.",
    sources: "nie.ac.in; en.wikipedia.org; shiksha.com",
    confidence: "medium",
    notes: "Placement figure may aggregate both NIE campuses (South is main/E142).",
  },
  E142: {
    established_year: 1946,
    type: "autonomous",
    website: "https://nie.ac.in",
    placement_overall_avg_lpa: 10.5,
    placement_year: 2024,
    about: "South (main) campus of The National Institute of Engineering, Mysuru; one of India's oldest engineering colleges.",
    sources: "nie.ac.in; en.wikipedia.org; shiksha.com",
    confidence: "high",
  },
  E164: {
    established_year: 2012,
    type: "university",
    website: "https://www.reva.edu.in",
    placement_cse_avg_lpa: 6,
    placement_overall_avg_lpa: 5,
    placement_year: 2024,
    about: "Private university established by the Divya Sree Foundation; Yelahanka campus; large engineering programs.",
    sources: "reva.edu.in; careers360.com; collegedunia.com",
    confidence: "medium",
  },
  E126: {
    established_year: 1986,
    type: "private",
    website: "https://www.sirmvit.edu",
    placement_overall_avg_lpa: 5.5,
    placement_year: 2024,
    about: "Yelahanka campus engineering college affiliated to VTU; named after Sir M. Visvesvaraya.",
    sources: "sirmvit.edu; shiksha.com; careers360.com",
    confidence: "medium",
    notes: "Established year cross-verified via official site; please confirm.",
  },
  E032: {
    established_year: 2000,
    type: "autonomous",
    website: "https://www.cmrit.ac.in",
    placement_overall_avg_lpa: 6.99,
    placement_year: 2024,
    about: "Run by CMR Jnanadhara Trust; located on AECS Layout / ITPL Main Road (not Brookefield as dataset notes); CSE-strong placements.",
    sources: "cmrit.ac.in; collegedunia.com; careers360.com",
    confidence: "high",
    notes: "Locality field in dataset says 'Brookefield' — verify; nearest landmark is Whitefield/ITPL.",
  },
  E033: {
    established_year: 2007,
    type: "private",
    website: "https://engg.cambridge.edu.in",
    placement_overall_avg_lpa: 7.2,         // 2024 median; 2026 avg also ~7.2
    placement_year: 2024,
    about: "Run by Habitat Educational Trust; K R Puram campus; mid-tier college with steady placement record.",
    sources: "cambridge.edu.in; shiksha.com; careers360.com",
    confidence: "high",
  },
  E104: {
    established_year: 2001,
    type: "private",
    website: "https://www.rnsit.ac.in",
    placement_overall_avg_lpa: 8,           // mid-estimate; 2024 highest 26.65 LPA, avg formal not published, 2025 avg ~15 LPA
    placement_year: 2024,
    about: "Founded by R N Shetty; located at R R Nagar; engineering programs across CSE/ECE/EEE/ME.",
    sources: "rnsit.ac.in; careers360.com; collegedunia.com",
    confidence: "low",
    notes: "2024 official average not released. Estimate from aggregator ranges and 2025 trend.",
  },
  E107: {
    established_year: 2001,
    type: "private",
    website: "https://www.sjbit.edu.in",
    placement_overall_avg_lpa: 5.5,
    placement_year: 2024,
    about: "Founded by Sri Adichunchanagiri Shikshana Trust (SAST); Kengeri campus.",
    sources: "sjbit.edu.in; collegedunia.com; shiksha.com",
    confidence: "medium",
    notes: "Sources vary between 4.2 and 6 LPA depending on batch; 5.5 used as mid-estimate.",
  },
  E198: {
    established_year: 2019,
    type: "private",
    website: "https://www.rvitm.edu.in",
    placement_overall_avg_lpa: 11.47,
    placement_year: 2024,
    about: "Newer sister institution of RVCE under Rashtreeya Sikshana Samithi Trust; J P Nagar campus; small intake.",
    sources: "rvitm.edu.in; shiksha.com; collegedunia.com",
    confidence: "medium",
    notes: "RVITM trust established 1999; college operational from 2019. Different entity from RVCE.",
  },

  // ── Tier 2: well-known mid-tier and specialized colleges ──
  E001: {
    established_year: 2000,
    type: "private",
    website: "https://acharya.ac.in",
    placement_overall_avg_lpa: 6,
    placement_year: 2024,
    about: "Soladevanahalli campus; large multi-disciplinary group with engineering, management and dental schools.",
    sources: "acharya.ac.in; careers360.com; shiksha.com",
    confidence: "medium",
  },
  E007: {
    established_year: 1999,
    type: "private",
    website: "https://amcec.edu.in",
    placement_overall_avg_lpa: 5.5,
    placement_year: 2024,
    about: "Run by Paramahamsa Foundation Trust; Bannerghatta Road campus.",
    sources: "amcec.edu.in; shiksha.com; collegedekho.com",
    confidence: "medium",
  },
  E015: {
    established_year: 2001,
    type: "autonomous",
    website: "https://bnmit.org",
    placement_overall_avg_lpa: 6.16,
    placement_year: 2024,
    about: "Run by Bhageerathi Bai Narayana Rao Maanay Charities Trust; Banashankari campus; autonomous.",
    sources: "bnmit.org; collegedunia.com; shiksha.com",
    confidence: "high",
  },
  E016: {
    established_year: 1947,
    type: "university",
    website: "https://www.kletech.ac.in",
    placement_overall_avg_lpa: 7,
    placement_year: 2024,
    about: "Private university based in Hubballi (also Belagavi campus); formerly B V Bhoomaraddi College of Engineering; A grade NAAC.",
    sources: "kletech.ac.in; en.wikipedia.org; collegedekho.com",
    confidence: "high",
  },
  E021: {
    established_year: 1979,
    type: "private",
    website: "https://www.bietdvg.edu",
    placement_overall_avg_lpa: 4.97,
    placement_year: 2024,
    about: "Davangere's flagship private engineering college; A grade NAAC; affiliated to VTU.",
    sources: "bietdvg.edu; collegedunia.com; careers360.com",
    confidence: "high",
  },
  E024: {
    established_year: 1963,
    type: "autonomous",
    website: "https://www.becbgk.edu",
    placement_overall_avg_lpa: 4,             // 2024 median
    placement_year: 2024,
    about: "Run by BVV Sangha; one of north Karnataka's oldest engineering colleges; autonomous.",
    sources: "becbgk.edu; careers360.com; collegedunia.com",
    confidence: "high",
  },
  E060: {
    established_year: 1997,
    type: "private",
    website: "https://www.jssateb.ac.in",
    placement_overall_avg_lpa: 6.5,        // 2024 median
    placement_year: 2024,
    about: "Bengaluru campus of the JSS Mahavidyapeetha Mysuru; Uttarahalli Main Road.",
    sources: "jssateb.ac.in; careers360.com; collegedunia.com",
    confidence: "high",
  },
  E089: {
    established_year: 1962,
    type: "autonomous",
    website: "https://pesce.ac.in",
    placement_overall_avg_lpa: 5.3,
    placement_year: 2024,
    about: "Founded by People's Education Society; Mandya campus; one of the oldest private engineering colleges in Karnataka.",
    sources: "pesce.ac.in; en.wikipedia.org; careers360.com",
    confidence: "high",
  },
  E090: {
    established_year: 2007,
    type: "private",
    website: "https://pesitm.edu",
    placement_overall_avg_lpa: 4.5,
    placement_year: 2024,
    about: "Shivamogga campus of the PES group; affiliated to VTU.",
    sources: "pesitm.edu; collegedunia.com; aajtakcampus.in",
    confidence: "medium",
  },
  E108: {
    established_year: 1986,
    type: "private",
    website: "https://sjcit.ac.in",
    placement_overall_avg_lpa: 5.4,
    placement_year: 2024,
    about: "Run by Sri Jagadguru Chandrashekaranatha Swamiji Educational Trust; BB Road, Chikkaballapur.",
    sources: "sjcit.ac.in; en.wikipedia.org; collegedunia.com",
    confidence: "high",
  },
  E116: {
    established_year: 2023,
    type: "university",
    website: "https://snpsu.edu.in",
    placement_overall_avg_lpa: 6,
    placement_year: 2024,
    about: "New private university (under Sapthagiri Group + NPS); Bengaluru.",
    sources: "snpsu.edu.in; collegedunia.com; careers360.com",
    confidence: "medium",
    notes: "First batch graduating soon — placement data is provisional.",
  },
  E147: {
    established_year: 1997,
    type: "private",
    website: "https://vvce.ac.in",
    placement_overall_avg_lpa: 4.5,     // 2024 median
    placement_year: 2024,
    about: "Run by Vidyavardhaka Sangha; Gokulam, Mysuru campus.",
    sources: "vvce.ac.in; careers360.com; collegedunia.com",
    confidence: "high",
  },
  E165: {
    established_year: 2010,
    type: "university",
    website: "https://www.alliance.edu.in",
    placement_overall_avg_lpa: 8.3,
    placement_year: 2024,
    about: "Private university with large engineering, business and law schools; Chandapura Anekal campus.",
    sources: "alliance.edu.in; shiksha.com; studyriserr.com",
    confidence: "high",
  },
  E171: {
    established_year: 2012,
    type: "deemed",
    website: "https://www.gitam.edu",
    placement_overall_avg_lpa: 4.5,
    placement_year: 2024,
    about: "Bengaluru campus of GITAM Deemed University (HQ Visakhapatnam); Doddaballapur Rural campus.",
    sources: "gitam.edu; shiksha.com; collegedekho.com",
    confidence: "medium",
  },
  E173: {
    established_year: 2013,
    type: "university",
    website: "https://presidencyuniversity.in",
    placement_cse_avg_lpa: 4.5,
    placement_overall_avg_lpa: 5,
    placement_year: 2024,
    about: "Private university at Itgalpur Rajanakunte, Yelahanka; engineering, management and law programs.",
    sources: "presidencyuniversity.in; collegedunia.com; shiksha.com",
    confidence: "medium",
  },
  E187: {
    established_year: 2013,
    type: "university",
    website: "https://cmr.edu.in",
    placement_overall_avg_lpa: 4,
    placement_year: 2024,
    about: "Private university; School of Engineering at Bagalur off Hennur Road; sister to CMRIT (separate institution).",
    sources: "cmr.edu.in; shiksha.com; careers360.com",
    confidence: "medium",
  },
  E197: {
    established_year: 2013,
    type: "university",
    website: "https://www.msruas.ac.in",
    placement_overall_avg_lpa: 6.2,
    placement_year: 2024,
    about: "Private university under the Ramaiah group; MSR Nagar; applied sciences focus including engineering, management and medical.",
    sources: "msruas.ac.in; careers360.com; shiksha.com",
    confidence: "high",
  },

  // ── Tier 3: notable Bengaluru/Karnataka private colleges ──
  E012: {
    established_year: 2000,
    type: "private",
    website: "https://atria.edu",
    placement_overall_avg_lpa: 10.32,
    placement_year: 2024,
    about: "Run by Atria Educational Foundation; Hebbal campus; recently autonomous status.",
    sources: "atria.edu; collegedunia.com; shiksha.com",
    confidence: "medium",
    notes: "10.32 LPA from aggregator; official average not formally released by college.",
  },
  E020: {
    established_year: 2010,
    type: "private",
    website: "https://btibangalore.in",
    placement_overall_avg_lpa: 6,
    placement_year: 2023,
    about: "Kodathi off Sarjapur Road; affiliated to VTU; relatively young engineering college.",
    sources: "comedk.org; collegedunia.com; careers360.com",
    confidence: "medium",
    notes: "2024 official average not found; using 2023 placement figure.",
  },
  E041: {
    established_year: 2001,
    type: "private",
    website: "https://www.donboscoit.edu.in",
    placement_overall_avg_lpa: 4.5,
    placement_year: 2024,
    about: "Mysore Road / Kengeri campus; private engineering college on a 36-acre campus.",
    sources: "donboscoit.edu.in; collegedunia.com; shiksha.com",
    confidence: "medium",
  },
  E042: {
    established_year: 1980,
    type: "autonomous",
    website: "https://drait.edu.in",
    placement_overall_avg_lpa: 7,
    placement_year: 2024,
    about: "Government-aided autonomous engineering college; Mallathalli campus; founded by Shri M H Jayaprakash Narayan.",
    sources: "drait.edu.in; collegedunia.com; careers360.com",
    confidence: "high",
  },
  E046: {
    established_year: 1999,
    type: "private",
    website: "https://epcet.edu.in",
    placement_overall_avg_lpa: 7.5,
    placement_year: 2024,
    about: "Engineering and technology arm of East Point Group of Institutions; Avalahalli, Bengaluru.",
    sources: "epcet.edu.in; collegedunia.com; collegedekho.com",
    confidence: "medium",
    notes: "Some sources list 1998 — official site says 1999.",
  },
  E050: {
    established_year: 2001,
    type: "private",
    website: "https://gat.ac.in",
    placement_overall_avg_lpa: 5.75,
    placement_year: 2024,
    about: "Run by National Education Foundation; Rajarajeshwari Nagar campus; NAAC A grade.",
    sources: "gat.ac.in; shiksha.com; careers360.com",
    confidence: "medium",
  },
  E067: {
    established_year: 2010,
    type: "private",
    website: "https://kssem.edu.in",
    placement_overall_avg_lpa: 7,
    placement_year: 2024,
    about: "Kanakapura Road; affiliated to VTU; engineering and management programs.",
    sources: "kssem.edu.in; careers360.com; shiksha.com",
    confidence: "medium",
    notes: "Placement rate 30-50% per sources — verify before publishing.",
  },
  E068: {
    established_year: 1999,
    type: "private",
    website: "https://www.ksit.ac.in",
    placement_overall_avg_lpa: 4.5,           // 2024 median
    placement_year: 2024,
    about: "Sister institution of KSSEM under K.S. Group; Kanakapura Road campus.",
    sources: "ksit.ac.in; collegedunia.com; campusoption.com",
    confidence: "medium",
  },
  E084: {
    established_year: 2001,
    type: "private",
    website: "https://ncet.co.in",
    placement_overall_avg_lpa: 4.5,
    placement_year: 2024,
    about: "Run by Nagarjuna Education Society; Devanahalli campus; NAAC A+ accredited.",
    sources: "ncet.co.in; collegedunia.com; careers360.com",
    confidence: "medium",
  },
  E099: {
    established_year: 2006,
    type: "private",
    website: "https://www.rrce.org",
    placement_overall_avg_lpa: 3.6,           // 2025 median; 2024 not officially split
    placement_year: 2025,
    about: "Run by Moogambigai Charitable and Education Trust; Mysore Road campus.",
    sources: "rrce.org; careers360.com; collegedekho.com",
    confidence: "low",
    notes: "2024 average not officially released; 2025 NIRF median used.",
  },
  E113: {
    established_year: 2008,
    type: "private",
    website: "https://saividya.ac.in",
    placement_overall_avg_lpa: 5.69,
    placement_year: 2024,
    about: "Run by Sai Vidya Educational Trust; Rajanukunte (off Doddaballapur Road) campus.",
    sources: "saividya.ac.in; collegedunia.com; en.wikipedia.org",
    confidence: "high",
  },
  E156: {
    established_year: 2011,
    type: "private",
    website: "https://jyothyit.ac.in",
    placement_overall_avg_lpa: 5,
    placement_year: 2024,
    about: "Udaypura (off Kanakapura Road); affiliated to VTU.",
    sources: "jyothyit.ac.in; collegedunia.com; shiksha.com",
    confidence: "low",
    notes: "Avg estimate; sources range 4–6 LPA. NIRF 2025 median ~3.5 LPA.",
  },
};

// ─── Apply to CSV ───
const csv = fs.readFileSync(CSV_PATH, "utf8").trim();
const lines = csv.split("\n");
const headers = lines[0].split(",");
const idx = Object.fromEntries(headers.map((h, i) => [h, i]));

const csvEscape = (s = "") => {
  if (s === null || s === undefined || s === "") return "";
  const str = String(s);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

let filled = 0;
const newLines = [lines[0]];
for (let i = 1; i < lines.length; i++) {
  // Naive CSV parse — fields don't contain commas/quotes for the seeded data
  // (code/locality/city are simple). Splitting works for the scaffold rows.
  // For rows we touch, we re-emit fields with proper escaping.
  const cells = lines[i].match(/("([^"]|"")*"|[^,]*)(,|$)/g)
    ?.map((c) => c.replace(/,$/, ""))
    .map((c) => (c.startsWith('"') ? c.slice(1, -1).replace(/""/g, '"') : c)) ?? [];
  const code = cells[0];
  if (!data[code]) {
    newLines.push(lines[i]);
    continue;
  }
  const d = data[code];
  cells[idx.established_year] = d.established_year ?? cells[idx.established_year] ?? "";
  cells[idx.type] = d.type ?? cells[idx.type] ?? "";
  cells[idx.website] = d.website ?? cells[idx.website] ?? "";
  cells[idx.placement_cse_avg_lpa] = d.placement_cse_avg_lpa ?? cells[idx.placement_cse_avg_lpa] ?? "";
  cells[idx.placement_overall_avg_lpa] = d.placement_overall_avg_lpa ?? cells[idx.placement_overall_avg_lpa] ?? "";
  cells[idx.placement_year] = d.placement_year ?? cells[idx.placement_year] ?? "";
  cells[idx.about] = d.about ?? cells[idx.about] ?? "";
  cells[idx.sources] = d.sources ?? cells[idx.sources] ?? "";
  cells[idx.confidence] = d.confidence ?? cells[idx.confidence] ?? "";
  cells[idx.notes] = d.notes ?? cells[idx.notes] ?? "";
  newLines.push(cells.map(csvEscape).join(","));
  filled++;
}

fs.writeFileSync(CSV_PATH, newLines.join("\n") + "\n");
console.log(`filled ${filled} rows out of ${lines.length - 1}`);
