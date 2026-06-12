import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
const page = await ctx.newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.fill("#rank", "34");
await page.waitForTimeout(400);

// Find the core section heading and screenshot the area around it
const eyebrow = page.getByText(/core engineering/i).first();
await eyebrow.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
const box = await eyebrow.boundingBox();
const clip = box
  ? { x: 0, y: Math.max(0, box.y - 30), width: 1280, height: 850 }
  : undefined;
await page.screenshot({ path: "/tmp/comedk-snaps/rank34-core.png", clip });
await browser.close();
console.log("done");
