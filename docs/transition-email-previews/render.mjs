// Renders the Transition email HTML previews to PNG (needs playwright-core and Chrome; not repo dependencies).
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import fs from "node:fs";
const dir = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".html"))) {
  const name = f.replace(/\.html$/, "");
  for (const [label, vp] of [["desktop", { width: 900, height: 900 }], ["mobile", { width: 375, height: 800 }]]) {
    const page = await browser.newPage({ viewport: vp });
    await page.goto(`file://${dir}/${f}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(name, label, overflow ? "HORIZONTAL OVERFLOW" : "ok");
    await page.screenshot({ path: `${dir}/${name}-${label}.png`, fullPage: true });
    await page.close();
  }
}
await browser.close();
