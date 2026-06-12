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

const errs = [];
page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
page.on("console", (msg) => {
  if (msg.type() === "error") errs.push("console: " + msg.text());
});

// 1) Initial home (full page)
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/m1-home-initial.png`, fullPage: true });
console.log("✓ m1-home-initial.png");

// 2) Type rank
await page.locator("#rank").tap();
await page.locator("#rank").fill("12000");
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/m2-home-with-rank.png`, fullPage: true });
console.log("✓ m2-home-with-rank.png");

// 3) Click first college row
const firstRow = page.locator("a.row").first();
const href = await firstRow.getAttribute("href");
console.log("clicking →", href);
await firstRow.tap();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/m3-college.png`, fullPage: true });
console.log("✓ m3-college.png");

// 4) Back to home
const backLink = page.locator("nav a").first();
await backLink.tap();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/m4-home-after-back.png`, fullPage: true });
console.log("✓ m4-home-after-back.png");

const url = page.url();
const rankValue = await page.inputValue("#rank");
console.log("returned URL:", url);
console.log("rank input value:", JSON.stringify(rankValue));

// 5) Viewport-only snapshot of post-back state (what user actually sees)
await page.screenshot({ path: `${OUT}/m5-home-after-back-viewport.png` });
console.log("✓ m5-home-after-back-viewport.png");

if (errs.length) {
  console.log("\nERRORS:");
  for (const e of errs) console.log(" -", e);
} else {
  console.log("\n(no runtime errors)");
}
await browser.close();
