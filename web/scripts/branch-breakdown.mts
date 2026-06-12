import { predict, groupByFamily } from "../src/lib/predict";

for (const rank of [12000, 25000, 60000]) {
  console.log(`\n=== rank ${rank} ===`);
  const m = predict(rank);
  const g = groupByFamily(m);
  for (const x of g) {
    const counts: Record<string, number> = {};
    for (const r of x.items) counts[r.branchCode] = (counts[r.branchCode] ?? 0) + 1;
    const breakdown = Object.entries(counts)
      .map(([k, v]) => `${k}:${v}`)
      .join(" ");
    console.log(`  ${x.family.padEnd(11)} ${x.items.length.toString().padStart(3)}  ${breakdown}`);
  }
}
