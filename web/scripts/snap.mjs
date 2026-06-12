// Quick visual smoke check + screenshots.
import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "/tmp/comedk-snaps";
fs.mkdirSync(OUT, { recursive: true });

const URL = process.env.URL ?? "http://localhost:3000";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
const page = await ctx.newPage();

console.log("→ loading", URL);
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(400);

// 1) Empty state
await page.screenshot({ path: `${OUT}/01-empty.png`, fullPage: true });
console.log("✓ 01-empty.png");

// 2) Rank 12000 (should give a healthy mix)
await page.fill("#rank", "12000");
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/02-rank12k.png`, fullPage: true });
console.log("✓ 02-rank12k.png");

// Console errors?
const errs = [];
page.on("pageerror", (e) => errs.push("pageerror " + e.message));
page.on("console", (msg) => {
  if (msg.type() === "error") errs.push("console " + msg.text());
});

// 3) Rank 60000
await page.fill("#rank", "60000");
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/03-rank60k.png`, fullPage: true });
console.log("✓ 03-rank60k.png");

// 4) Rank way past the field
await page.fill("#rank", "200000");
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/04-rank200k.png`, fullPage: true });
console.log("✓ 04-rank200k.png");

// 5) Mobile viewport
await page.setViewportSize({ width: 390, height: 844 });
await page.fill("#rank", "20000");
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/05-mobile.png`, fullPage: true });
console.log("✓ 05-mobile.png");

// Sample a few rendered rows to confirm content & layout.
const rows = await page.$$eval(".row", (els) =>
  els.slice(0, 5).map((el) => el.textContent?.replace(/\s+/g, " ").trim() ?? ""),
);
console.log("\nfirst rows:");
for (const r of rows) console.log("  ·", r);

if (errs.length) {
  console.log("\n⚠ runtime errors:");
  for (const e of errs) console.log("  -", e);
}

await browser.close();
console.log("\nDone. Out dir:", OUT);
