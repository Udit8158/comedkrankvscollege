import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
const page = await ctx.newPage();

// 1) Predictor with rank
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.fill("#rank", "12000");
await page.waitForTimeout(400);
await page.evaluate(() => window.scrollTo(0, 700));
await page.screenshot({ path: "/tmp/comedk-snaps/ct1-predictor.png" });
console.log("✓ ct1-predictor.png");

// 2) Click an RVCE link (E095 won't appear at rank 12000 though — try E040 or click any computing row)
// Find the first row link and click
const firstRow = page.locator("a.row").first();
const href = await firstRow.getAttribute("href");
console.log("clicking →", href);
await firstRow.click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(300);
await page.screenshot({ path: "/tmp/comedk-snaps/ct2-college-arrived.png" });
console.log("✓ ct2-college-arrived.png");

// 3) Go back via back link
const backLink = page.locator("nav a").first();
await backLink.click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollTo(0, 500));
await page.screenshot({ path: "/tmp/comedk-snaps/ct3-back-to-predictor.png" });
console.log("✓ ct3-back-to-predictor.png");

const url = page.url();
const rankValue = await page.inputValue("#rank");
console.log("returned URL:", url);
console.log("rank input value preserved as:", rankValue);

await browser.close();
