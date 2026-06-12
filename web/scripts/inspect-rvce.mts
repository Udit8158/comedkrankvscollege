import raw from "../src/data.json";
import { familyOf, cleanBranchName } from "../src/lib/branches";

type RawRecord = { college: string; branch: string; rank: number };
type RawCollege = { code: string; name: string };
type RawBranch = { code: string; name: string };

const data = raw as { colleges: RawCollege[]; branches: RawBranch[]; records: RawRecord[] };

// Find RVCE entries by name match
const rvce = data.colleges.filter((c) =>
  /R\.?\s*V\.?\s*College of Engineering|R V College/i.test(c.name),
);
console.log("RVCE colleges in dataset:");
for (const c of rvce) console.log(`  ${c.code}  ${c.name}`);

const rvceCodes = new Set(rvce.map((c) => c.code));
const recs = data.records.filter((r) => rvceCodes.has(r.college));
console.log(`\nRVCE records (${recs.length} total):`);
for (const r of recs) {
  const bn = data.branches.find((b) => b.code === r.branch);
  console.log(
    `  ${r.college}  ${r.branch.padEnd(4)} ${familyOf(r.branch) ?? "n/a"}  cutoff=${r.rank.toString().padStart(6)}  ${cleanBranchName(bn?.name ?? "?")}`,
  );
}

// Also show all core records sorted by cutoff to see what top 10 looks like
console.log("\nAll core records sorted by cutoff (top 15):");
const core = data.records.filter((r) => familyOf(r.branch) === "core");
core.sort((a, b) => a.rank - b.rank);
for (const r of core.slice(0, 15)) {
  const cn = data.colleges.find((c) => c.code === r.college)!.name;
  const bn = data.branches.find((b) => b.code === r.branch)!.name;
  console.log(
    `  ${r.college}  ${r.branch.padEnd(4)} cutoff=${r.rank.toString().padStart(6)}  ${cn.split("-")[0]}  ::  ${cleanBranchName(bn).slice(0, 40)}`,
  );
}
