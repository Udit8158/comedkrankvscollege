import { predict, groupByFamily, TOTAL_RECORDS } from "../src/lib/predict";

console.log(`Total records loaded: ${TOTAL_RECORDS}`);

for (const rank of [5000, 25000, 60000, 95000, 150000]) {
  const m = predict(rank);
  const groups = groupByFamily(m);
  console.log(`\n=== rank ${rank.toLocaleString()} — ${m.length} matches ===`);
  for (const g of groups) {
    console.log(`  [${g.family}] ${g.items.length}`);
    for (const x of g.items.slice(0, 3)) {
      console.log(
        `    ${x.collegeCode} ${x.branchCode.padEnd(4)} cutoff=${x.cutoff
          .toString()
          .padStart(6)} tier=${x.tier} fit=${x.fit.toFixed(2)}`,
      );
    }
  }
}
