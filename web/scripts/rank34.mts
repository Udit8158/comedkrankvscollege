import { predict, groupByFamily } from "../src/lib/predict";
const m = predict(34);
const g = groupByFamily(m);
for (const x of g) {
  console.log(`=== ${x.family} (${x.items.length}) ===`);
  for (const r of x.items) {
    console.log(
      `  ${r.collegeCode}  ${r.branchCode.padEnd(4)} cutoff=${r.cutoff.toString().padStart(6)}  ${r.collegeName.split("-")[0].slice(0, 42)}`,
    );
  }
}
