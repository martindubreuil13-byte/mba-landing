// Builds the downloadable Customer Architecture Map resource from the same
// data the Thinking article uses (app/lib/customer-architecture/map.ts):
//
//   The-Customer-Architecture-Map.pdf   two pages: how to use it + the Map
//   the-customer-architecture-map-cover.png   1000×1294 resource cover
//
// The PDF is US Letter with generous margins, so it also prints on A4 without
// losing content.
//
// Usage:
//   node --experimental-strip-types scripts/build-customer-map-resource.mjs <output-dir>

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  CUSTOMER_ARCHITECTURE_MAP,
  CUSTOMER_ARCHITECTURE_MAP_TITLE,
} from "../app/lib/customer-architecture/map.ts";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTICLE_URL = "https://modernbusinessarchitect.com/thinking/how-to-define-your-ideal-customer";
const SUBTITLE = "Define who you're actually building for before you give them a name and a face.";

const outDir = process.argv[2];
if (!outDir) {
  console.error("Usage: node --experimental-strip-types scripts/build-customer-map-resource.mjs <output-dir>");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const pad = (n) => String(n).padStart(2, "0");

const STYLE = `
  @page { size: 8.5in 11in; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; }
  body { font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif; color: #1a1816; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 8.5in; height: 11in; padding: 15mm 16mm 13mm; display: flex; flex-direction: column; page-break-after: always; overflow: hidden; }
  .page:last-child { page-break-after: auto; }
  .eyebrow { font-size: 7.5pt; letter-spacing: .16em; text-transform: uppercase; color: rgba(26,24,22,.5); }
  .red { color: #6b1f1f; }
  .strong { font-weight: 600; }
  .rule { border-top: 1px solid rgba(26,24,22,.18); }
  a { color: inherit; }
`;

function howToPage() {
  const steps = [
    ["Pick one customer.", "One Map per customer. If you keep writing “or”, you probably have two."],
    ["Work through each section.", "In any order. You'll find that answering one changes another."],
    ["Write plainly.", "Short, specific sentences. Use the customer's own words wherever you have them."],
    ["Mark every meaningful statement.", "K if you know it from evidence. A if you're assuming it."],
    ["Pay attention to the A's.", "Circle the ones that would damage the business most if they turned out to be wrong."],
    ["Go and collect evidence.", "Conversations, observation, real enquiries, real offers at real prices."],
    ["Come back and update the Map.", "Turn A's into K's, or change the Map. Both are progress."],
  ];

  return `
  <section class="page">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <p class="eyebrow red strong">The Modern Business Architect</p>
      <p class="eyebrow">Free resource</p>
    </div>

    <h1 style="margin-top:16mm;font-size:34pt;font-weight:300;line-height:1.08;letter-spacing:-.01em">${esc(CUSTOMER_ARCHITECTURE_MAP_TITLE)}</h1>
    <p style="margin-top:5mm;font-size:13pt;font-weight:300;line-height:1.45;color:rgba(26,24,22,.72);max-width:140mm">${esc(SUBTITLE)}</p>

    <div class="rule" style="margin-top:10mm"></div>
    <p class="eyebrow red strong" style="margin-top:8mm">How to use it</p>

    <ol style="list-style:none;margin-top:6mm">
      ${steps
        .map(
          ([title, body], i) => `
        <li style="display:grid;grid-template-columns:11mm 1fr;padding:2.6mm 0;border-bottom:1px solid rgba(26,24,22,.1)">
          <span style="font-size:9pt;color:rgba(26,24,22,.4);padding-top:.6mm">${pad(i + 1)}</span>
          <span style="font-size:10.5pt;line-height:1.5"><span class="strong">${esc(title)}</span> <span style="color:rgba(26,24,22,.7)">${esc(body)}</span></span>
        </li>`,
        )
        .join("")}
    </ol>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:8mm">
      <div style="border:1px solid rgba(26,24,22,.2);padding:5mm">
        <p style="font-size:22pt;font-weight:300" class="red">K</p>
        <p class="eyebrow strong" style="margin-top:1mm;color:#1a1816">Known from evidence</p>
        <p style="font-size:9pt;line-height:1.5;margin-top:2mm;color:rgba(26,24,22,.7)">Interviews, observed behaviour, existing purchases, enquiries, sales conversations, transactions.</p>
      </div>
      <div style="border:1px solid rgba(26,24,22,.2);padding:5mm">
        <p style="font-size:22pt;font-weight:300" class="red">A</p>
        <p class="eyebrow strong" style="margin-top:1mm;color:#1a1816">Assumed</p>
        <p style="font-size:9pt;line-height:1.5;margin-top:2mm;color:rgba(26,24,22,.7)">“I think”, “they probably”, “most people”, and anything you know mainly because you are the customer.</p>
      </div>
    </div>

    <p style="margin-top:9mm;margin-bottom:8mm;font-size:15pt;font-weight:300;line-height:1.4;max-width:150mm">The goal isn't to eliminate assumptions before you start. It's to know which assumptions you're betting the business on.</p>

    <div style="margin-top:auto" class="rule"></div>
    <p style="margin-top:4mm;font-size:8.5pt;line-height:1.55;color:rgba(26,24,22,.65)">When your Map is complete, return to the online guide to turn it into a written persona and an optional visual profile using the AI prompts:<br><a href="${ARTICLE_URL}" class="red">${ARTICLE_URL.replace("https://", "")}</a></p>
    <p class="eyebrow" style="margin-top:4mm">Martin Dubreuil · The Modern Business Architect</p>
  </section>`;
}

// Open writing space. Ruled lines were tried and ended up too close together
// to handwrite on; blank space adapts to any handwriting size.
function writingSpace() {
  return `<div style="flex:1;min-height:0"></div>`;
}

function mapCell(section, index) {
  return `
    <div style="background:#fff;padding:3mm 4.5mm 2.5mm;display:flex;flex-direction:column">
      <p style="display:flex;gap:2.5mm;align-items:baseline">
        <span style="font-size:7pt;color:rgba(26,24,22,.38)">${pad(index + 1)}</span>
        <span class="eyebrow red strong" style="font-size:8pt">${esc(section.label)}</span>
      </p>
      <p style="font-size:10pt;font-weight:300;line-height:1.3;margin-top:1mm">${esc(section.question)}</p>
      <p style="font-size:7pt;line-height:1.35;margin-top:.8mm;color:rgba(26,24,22,.55)">${esc(section.cue)}</p>
      ${writingSpace()}
    </div>`;
}

function mapPage() {
  const sections = CUSTOMER_ARCHITECTURE_MAP.filter((s) => s.key !== "evidence");
  const evidence = CUSTOMER_ARCHITECTURE_MAP.find((s) => s.key === "evidence");

  return `
  <section class="page">
    <div style="border:1px solid rgba(26,24,22,.25);flex:1;min-height:0;display:flex;flex-direction:column">
      <div style="padding:4mm 4.5mm 3.5mm;border-bottom:1px solid rgba(26,24,22,.25)">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <p class="eyebrow red strong" style="font-size:9pt">${esc(CUSTOMER_ARCHITECTURE_MAP_TITLE)}</p>
          <p class="eyebrow" style="font-size:6.5pt">The Modern Business Architect</p>
        </div>
        <p style="font-size:8pt;margin-top:1.5mm;color:rgba(26,24,22,.65)">Write plainly. Mark every line <span class="strong red">K</span> (known from evidence) or <span class="strong red">A</span> (assumed).</p>
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:5mm;margin-top:4mm">
          ${["Customer", "Version", "Date"].map((f) => `<p class="eyebrow" style="font-size:6.5pt;border-bottom:1px solid rgba(26,24,22,.25);padding-bottom:4mm">${f}</p>`).join("")}
        </div>
      </div>

      <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(6,minmax(0,1fr));min-height:0;gap:1px;background:rgba(26,24,22,.18)">
        ${sections.map((s, i) => mapCell(s, i)).join("")}
        <div style="background:#fff;padding:3mm 4.5mm 2.5mm;display:flex;flex-direction:column;grid-column:span 2">
          <p style="display:flex;gap:2.5mm;align-items:baseline">
            <span style="font-size:7pt;color:rgba(26,24,22,.38)">${pad(CUSTOMER_ARCHITECTURE_MAP.length)}</span>
            <span class="eyebrow red strong" style="font-size:8pt">${esc(evidence.label)}</span>
          </p>
          <p style="font-size:10pt;font-weight:300;line-height:1.3;margin-top:1mm">${esc(evidence.question)}</p>
          <p style="font-size:7pt;line-height:1.35;margin-top:.8mm;color:rgba(26,24,22,.55)">${esc(evidence.cue)}</p>
          <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:1.5mm">
            ${["We know (K)", "We are assuming (A)"].map((c) => `<div style="display:flex;flex-direction:column"><p class="eyebrow" style="font-size:6.5pt">${c}</p>${writingSpace()}</div>`).join("")}
          </div>
        </div>
      </div>
    </div>
    <p class="eyebrow" style="font-size:6.5pt;margin-top:3mm;display:flex;justify-content:space-between">
      <span>modernbusinessarchitect.com</span><span>© Martin Dubreuil</span>
    </p>
  </section>`;
}

function coverHtml() {
  // A working document, seen from above: the title block and a faint map grid.
  const cells = CUSTOMER_ARCHITECTURE_MAP.filter((s) => s.key !== "evidence")
    .map(
      (s, i) => `<div style="background:#f5f1ed;padding:18px 20px">
        <p style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:rgba(26,24,22,.35)">${pad(i + 1)} <span style="color:rgba(107,31,31,.55);font-weight:600">${esc(s.label)}</span></p>
        <div style="margin-top:34px;border-bottom:1px solid rgba(26,24,22,.1)"></div>
        <div style="margin-top:22px;border-bottom:1px solid rgba(26,24,22,.1)"></div>
      </div>`,
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 1000px; height: 1294px; overflow: hidden; }
    body { background: #f5f1ed; font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif; color: #1a1816; padding: 72px 72px 64px; display: flex; flex-direction: column; }
  </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <p style="font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:rgba(26,24,22,.55)">The Modern Business Architect</p>
      <div style="width:14px;height:14px;background:#6b1f1f"></div>
    </div>
    <p style="margin-top:120px;font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:#6b1f1f;font-weight:600">Worksheet</p>
    <h1 style="margin-top:22px;font-size:76px;line-height:1.05;font-weight:300;letter-spacing:-.01em">The Customer<br>Architecture Map</h1>
    <p style="margin-top:28px;font-size:24px;line-height:1.45;font-weight:300;color:rgba(26,24,22,.7);max-width:720px">${esc(SUBTITLE)}</p>
    <div style="margin-top:auto;border:1px solid rgba(26,24,22,.22);display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(26,24,22,.14)">${cells}</div>
    <p style="margin-top:22px;font-size:14px;letter-spacing:.2em;text-transform:uppercase;color:rgba(26,24,22,.5)">Martin Dubreuil</p>
  </body></html>`;
}

const work = mkdtempSync(join(tmpdir(), "customer-map-"));
const pdfHtml = join(work, "map.html");
const coverFile = join(work, "cover.html");
writeFileSync(pdfHtml, `<!doctype html><html><head><meta charset="utf-8"><title>${CUSTOMER_ARCHITECTURE_MAP_TITLE}</title><style>${STYLE}</style></head><body>${howToPage()}${mapPage()}</body></html>`);
writeFileSync(coverFile, coverHtml());

const pdfOut = resolve(outDir, "The-Customer-Architecture-Map.pdf");
const coverOut = resolve(outDir, "the-customer-architecture-map-cover.png");
const common = ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-pdf-header-footer"];

execFileSync(CHROME, [...common, `--print-to-pdf=${pdfOut}`, `file://${pdfHtml}`], { stdio: "ignore" });
execFileSync(CHROME, [...common, "--window-size=1000,1294", `--screenshot=${coverOut}`, `file://${coverFile}`], { stdio: "ignore" });

console.log(`PDF:   ${pdfOut}\nCover: ${coverOut}`);
