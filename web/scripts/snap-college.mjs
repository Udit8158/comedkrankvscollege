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

async function shoot(url, name) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(`✓ ${name}.png`);
}

await shoot("http://localhost:3000/college/E095?rank=12000", "c1-rvce-rank12k");
await shoot("http://localhost:3000/college/E095", "c2-rvce-noRank");
await shoot("http://localhost:3000/college/E209", "c3-longtail-no-meta");
await shoot("http://localhost:3000/college/E028?rank=25000", "c4-bmsit-rank25k");

await browser.close();
