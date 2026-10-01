import { chromium } from "playwright-core";
import fs from "node:fs";
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const p = await b.newPage();
await p.goto("http://localhost:3000/resources/build-the-bridge-first", { waitUntil: "networkidle" });
const out = await p.evaluate(() => {
  const res = {};
  for (const sec of document.querySelectorAll('#guide section[id^="page-"]')) {
    const blocks = [];
    sec.querySelectorAll("h2,h3,p,li,th,td,dt,caption").forEach((el) => {
      if (el.querySelector("h2,h3,p,li,th,td,dt,caption")) return; // leaf blocks only
      const t = el.textContent.replace(/\s+/g, " ").trim();
      if (t) blocks.push(t);
    });
    // aria-hidden marks render no text; the headings that contain <strong> are covered by textContent
    res[sec.id] = { blocks, nonTextMarks: sec.querySelectorAll('[aria-hidden="true"]').length };
  }
  return res;
});
fs.writeFileSync("html-blocks.json", JSON.stringify(out, null, 1));
await b.close();
console.log(Object.entries(out).map(([k, v]) => `${k}: ${v.blocks.length} blocks`).join("\n"));
