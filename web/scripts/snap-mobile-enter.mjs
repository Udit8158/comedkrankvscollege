import { chromium, devices } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  ...devices["iPhone 14"],
  colorScheme: "dark",
});
const page = await ctx.newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

// Snapshot the visible viewport (NOT fullPage) so we see what the user
// actually sees on the phone.
await page.screenshot({ path: "/tmp/comedk-snaps/mob-1-initial.png" });

// Tap the input and type
await page.locator("#rank").tap();
await page.locator("#rank").fill("12000");
await page.waitForTimeout(300);

// Before Enter: viewport should still be at the top (input area)
await page.screenshot({ path: "/tmp/comedk-snaps/mob-2-typed.png" });

// Press Enter (simulates the mobile "Go" key)
await page.locator("#rank").press("Enter");
await page.waitForTimeout(600); // smooth scroll

// After Enter: results should be in view
await page.screenshot({ path: "/tmp/comedk-snaps/mob-3-after-enter.png" });

await browser.close();
console.log("done");
