import { chromium, devices } from "playwright";
import fs from "node:fs";
const OUT = "/tmp/comedk-snaps";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  ...devices["iPhone 14"],
  colorScheme: "dark",
});
const page = await ctx.newPage();

// State: visit /?rank=12000 directly (simulates the post-back state)
await page.goto("http://localhost:3000/?rank=12000", { waitUntil: "networkidle" });
await page.waitForTimeout(400);

// Scroll through and grab viewports
const viewports = [0, 500, 1000, 1500, 2000];
for (const y of viewports) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/mv-${y}.png` });
  console.log(`✓ mv-${y}.png`);
}

await browser.close();
