import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
const page = await ctx.newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.fill("#rank", "12000");
await page.waitForTimeout(400);
const handle = page.locator("footer").first();
await handle.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
const box = await handle.boundingBox();
if (box) {
  // Pad a bit above and below
  const clip = {
    x: 0,
    y: Math.max(0, box.y - 60),
    width: 1280,
    height: Math.min(900, box.height + 120),
  };
  await page.screenshot({ path: "/tmp/comedk-snaps/footer-rest.png", clip });
  await page.locator("footer a").hover();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "/tmp/comedk-snaps/footer-hover.png", clip });
}
await browser.close();
console.log("done");
