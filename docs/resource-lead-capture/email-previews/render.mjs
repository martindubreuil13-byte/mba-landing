// Renders the delivery-email HTML previews to PNG (needs playwright-core and Chrome; not repo dependencies).
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
for (const state of ["pending", "active", "none"]) {
  for (const [label, vp] of [["desktop", { width: 900, height: 900 }], ["mobile", { width: 375, height: 800 }]]) {
    const page = await browser.newPage({ viewport: vp });
    await page.goto(`file://${dir}/delivery-${state}.html`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(state, label, overflow ? "HORIZONTAL OVERFLOW" : "no horizontal overflow");
    await page.screenshot({ path: `${dir}/delivery-${state}-${label}.png`, fullPage: true });
    await page.close();
  }
}
await browser.close();
