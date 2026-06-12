import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "/tmp/comedk-snaps";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
const page = await ctx.newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

// Scroll to results section after typing
await page.fill("#rank", "12000");
await page.waitForTimeout(500);

// Top viewport
await page.screenshot({ path: `${OUT}/d-top.png` });
console.log("✓ d-top.png");

// Scroll to first results and shoot
await page.evaluate(() => window.scrollTo(0, 600));
await page.waitForTimeout(150);
await page.screenshot({ path: `${OUT}/d-results.png` });
console.log("✓ d-results.png");

// Scroll deeper into electronics
await page.evaluate(() => window.scrollTo(0, 1500));
await page.waitForTimeout(150);
await page.screenshot({ path: `${OUT}/d-electronics.png` });
console.log("✓ d-electronics.png");

await browser.close();
