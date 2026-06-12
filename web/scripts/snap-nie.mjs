import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
const page = await ctx.newPage();
await page.goto("http://localhost:3000/college/E085", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/comedk-snaps/nie-north.png", fullPage: true });
await browser.close();
console.log("done");
