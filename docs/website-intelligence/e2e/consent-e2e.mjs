// Real-browser consent matrix for Google Analytics + Website Intelligence. NOT part of `npm test`: it needs a PRODUCTION-MODE build
// (APP_ENV=production at build time, so the real GA tag is included), served locally against an ISOLATED database, plus a local
// admin user (admin@example.com / local-throwaway-pw-1; see docs/resource-lead-capture/e2e/seed.mjs for the pattern).
//   node docs/website-intelligence/e2e/consent-e2e.mjs <output-dir-for-screenshots>
// Env: BASE (default http://localhost:3101), CHROMIUM (path to a Chromium/Chrome binary; default = Playwright's own).
// Playwright is used from node_modules (it is not a declared dependency of the site; `npm i -D playwright` in a scratch checkout if missing).
// Safety: every outgoing Google Analytics request is ABORTED by the script, so nothing reaches a real GA property. Only Google's
// gtag.js file itself is downloaded (to measure real behaviour). Run it only against localhost.
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3101";
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE)) throw new Error("Refusing to run against a non-local BASE");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), headless: true, args: ["--user-agent=" + UA] });
let failures = 0;
const check = (name, ok, extra = "") => { if (!ok) failures++; console.log(`${ok ? "  ok " : "  FAIL"} ${name}${extra ? "  [" + extra + "]" : ""}`); };

async function visitor({ country, region, gpc, dnt, viewport } = {}) {
  const headers = {}; if (country) headers["x-vercel-ip-country"] = country; if (region) headers["x-vercel-ip-country-region"] = region;
  const ctx = await b.newContext({ userAgent: UA, extraHTTPHeaders: headers, viewport: viewport ?? { width: 1280, height: 800 } });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  if (gpc) await ctx.addInitScript(() => Object.defineProperty(navigator, "globalPrivacyControl", { get: () => true }));
  if (dnt) await ctx.addInitScript(() => Object.defineProperty(navigator, "doNotTrack", { get: () => "1" }));
  const t = { gtagLoads: 0, gaHits: 0, wi: 0 };
  await ctx.route(/(google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com|google\.com\/(ccm|pagead))/, (r) => { if (new URL(r.request().url()).pathname.includes("/collect")) t.gaHits++; r.abort(); });
  await ctx.route(/googletagmanager\.com/, (r) => { t.gtagLoads++; r.continue(); });
  const page = await ctx.newPage();
  page.on("request", (r) => r.url().endsWith("/api/wi") && t.wi++);
  const gaCookies = async () => (await ctx.cookies()).filter((c) => c.name === "_ga" || c.name.startsWith("_ga_")).map((c) => c.name);
  const manualPv = () => page.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)).filter((a) => a[0] === "event" && a[1] === "page_view").map((a) => a[2].page_path));
  const banner = () => page.getByRole("region", { name: /Google Analytics|Analytics preferences/ });
  return { ctx, page, t, gaCookies, manualPv, banner };
}
const settle = (p, ms = 2500) => p.waitForTimeout(ms);
const until = async (fn, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await fn()) return true; await new Promise((r) => setTimeout(r, 200)); } return false; };

console.log("\nS1  Germany (consent required), first visit");
{ const v = await visitor({ country: "DE" }); await v.page.goto(BASE + "/work"); await settle(v.page);
  check("banner is shown", await v.banner().isVisible());
  check("NO gtag.js requested before consent", v.t.gtagLoads === 0, `loads=${v.t.gtagLoads}`);
  check("NO Google hits before consent", v.t.gaHits === 0);
  check("NO _ga cookies before consent", (await v.gaCookies()).length === 0);
  check("no dataLayer / gtag defined before consent", await v.page.evaluate(() => window.dataLayer === undefined && window.gtag === undefined));
  check("Website Intelligence still runs, independent of the pending choice", v.t.wi >= 1, `beacons=${v.t.wi}`);
  await v.page.getByRole("link", { name: "Answers" }).first().click().catch(() => {}); await settle(v.page, 1500);
  check("browsing while undecided still sends nothing to Google", v.t.gaHits === 0 && v.t.gtagLoads === 0);
  await v.banner().getByRole("button", { name: "Allow" }).click(); await until(async () => (await v.gaCookies()).length >= 1); await settle(v.page, 500);
  check("after Allow: gtag.js loads once", v.t.gtagLoads === 1, `loads=${v.t.gtagLoads}`);
  check("after Allow: _ga cookies set", (await v.gaCookies()).length >= 1, (await v.gaCookies()).join(","));
  check("after Allow: banner gone", !(await v.banner().isVisible()));
  const pv = await v.manualPv(); check("after Allow: current page measured exactly once (manual)", pv.length === 1, pv.join(" "));
  check("choice stored", await v.page.evaluate(() => JSON.parse(localStorage.getItem("mba_analytics_consent")).choice === "granted"));
  await v.page.reload(); await until(async () => v.t.gtagLoads >= 2); await settle(v.page, 500);
  check("reload: no banner again, GA starts from the stored choice", !(await v.banner().isVisible()) && v.t.gtagLoads === 2);
  await v.ctx.close(); }

console.log("\nS2  Germany declines");
{ const v = await visitor({ country: "DE" }); await v.page.goto(BASE + "/work"); await settle(v.page);
  await v.banner().getByRole("button", { name: "Decline" }).click(); await settle(v.page, 2000);
  await v.page.goto(BASE + "/answers"); await settle(v.page, 3000); await v.page.reload(); await settle(v.page, 3000);
  check("never loads gtag.js", v.t.gtagLoads === 0); check("no Google hits", v.t.gaHits === 0);
  check("no _ga cookies", (await v.gaCookies()).length === 0); check("not asked again", !(await v.banner().isVisible()));
  check("Website Intelligence unaffected by the decline", v.t.wi >= 2, `beacons=${v.t.wi}`);
  await v.ctx.close(); }

console.log("\nS3  Germany with a Global Privacy Control signal");
{ const v = await visitor({ country: "DE", gpc: true }); await v.page.goto(BASE + "/work"); await settle(v.page, 3500);
  check("no banner (signal respected, not asked)", !(await v.banner().isVisible()));
  check("no gtag.js, no hits, no cookies", v.t.gtagLoads === 0 && v.t.gaHits === 0 && (await v.gaCookies()).length === 0);
  check("Website Intelligence also silent under GPC (as designed)", v.t.wi === 0);
  await v.ctx.close(); }
console.log("\nS3b Do Not Track, outside the consent regions (US)");
{ const v = await visitor({ country: "US", dnt: true }); await v.page.goto(BASE + "/work"); await settle(v.page, 3500);
  check("US + DNT: GA off, no banner, no cookies", v.t.gtagLoads === 0 && !(await v.banner().isVisible()) && (await v.gaCookies()).length === 0);
  await v.ctx.close(); }

console.log("\nS4  United States (opt-out region)");
{ const v = await visitor({ country: "US" }); await v.page.goto(BASE + "/"); await until(async () => (await v.gaCookies()).length >= 1); await settle(v.page, 500);
  check("no banner", !(await v.banner().isVisible()));
  check("GA runs without asking", v.t.gtagLoads === 1 && (await v.gaCookies()).length >= 1);
  await v.page.locator('a[href="/work"]:visible').first().click(); await settle(v.page, 1500);
  await v.page.locator('a[href="/answers"]:visible').first().click(); await settle(v.page, 1500);
  const pv = await v.manualPv(); check("one manual page_view per navigation, paths redacted/clean", pv.join(" ") === "/ /work /answers", pv.join(" "));
  console.log("\nS8  withdrawal through Analytics preferences");
  await v.page.getByRole("button", { name: "Analytics preferences" }).first().click(); await settle(v.page, 500);
  check("panel opens with current status", await v.banner().isVisible() && (await v.banner().innerText()).includes("Google Analytics is on"));
  check("focus moved to the panel", await v.page.evaluate(() => document.activeElement?.getAttribute("aria-labelledby") === "analytics-choice-title"));
  await v.page.keyboard.press("Escape"); await settle(v.page, 300);
  check("Escape closes it and returns focus to the footer control", !(await v.banner().isVisible()) && (await v.page.evaluate(() => document.activeElement?.textContent === "Analytics preferences")));
  await v.page.getByRole("button", { name: "Analytics preferences" }).first().click();
  await v.banner().getByRole("button", { name: "Decline" }).click(); await settle(v.page, 3000);
  check("withdrawal removes the GA cookies", (await v.gaCookies()).length === 0, (await v.gaCookies()).join(","));
  // A hit GA had already queued just before the withdrawal may still be delivered (gtag.js batches for about a second), so the baseline is
  // taken after that has flushed. What must never happen is a hit for activity AFTER the withdrawal.
  const hitsBefore = v.t.gaHits;
  await v.page.locator('a[href="/thinking"]:visible').first().click(); await settle(v.page, 2500);
  await v.page.locator('a[href="/work"]:visible').first().click(); await settle(v.page, 2500);
  check("no Google hit for any activity after withdrawal", v.t.gaHits === hitsBefore, `hits ${hitsBefore}->${v.t.gaHits}`);
  const flag = await v.page.evaluate(() => window["ga-disable-G-VWKDNXD9JD"]); check("Google's own disable flag is set", flag === true);
  await v.ctx.close(); }

console.log("\nS5  unknown location (fail closed)  /  S6 Quebec vs Ontario");
for (const [label, hdr, expectBanner] of [["no location headers", {}, true], ["CA-QC", { country: "CA", region: "QC" }, true], ["CA-ON", { country: "CA", region: "ON" }, false], ["GB", { country: "GB" }, true], ["FR", { country: "FR" }, true], ["EE", { country: "EE" }, true], ["AU", { country: "AU" }, false]]) {
  const v = await visitor(hdr); await v.page.goto(BASE + "/work"); await settle(v.page, 3500);
  const shown = await v.banner().isVisible(); check(`${label}: banner ${expectBanner ? "shown" : "not shown"}`, shown === expectBanner);
  if (expectBanner) check(`${label}: nothing loaded or set before the choice`, v.t.gtagLoads === 0 && (await v.gaCookies()).length === 0);
  await v.ctx.close(); }

console.log("\nS7  admin activity");
{ const v = await visitor({ country: "US" });
  await v.page.goto(BASE + "/admin"); await v.page.locator('input[type="email"]').fill("admin@example.com"); await v.page.locator('input[type="password"]').fill("local-throwaway-pw-1");
  await v.page.locator('button[type="submit"]').click(); await v.page.waitForURL(/admin\/resources/, { timeout: 20000 }); await settle(v.page, 2500);
  check("signed-in admin on admin pages: no gtag.js, hits, cookies or banner", v.t.gtagLoads === 0 && v.t.gaHits === 0 && (await v.gaCookies()).length === 0 && !(await v.banner().isVisible()));
  await v.page.goto(BASE + "/answers/what-is-business-architecture"); await settle(v.page, 3500);
  check("signed-in admin on a PUBLIC page: still no GA, no cookies, no banner", v.t.gtagLoads === 0 && v.t.gaHits === 0 && (await v.gaCookies()).length === 0 && !(await v.banner().isVisible()));
  await v.ctx.close(); }
{ const v = await visitor({ country: "US" }); await v.page.goto(BASE + "/work"); await until(async () => (await v.manualPv()).length >= 1); await settle(v.page, 500);
  check("US visitor: GA running on a public page", v.t.gtagLoads === 1 && (await v.manualPv()).join(" ") === "/work");
  const hits = v.t.gaHits;
  const viaRouter = await v.page.evaluate(() => { if (!window.next?.router) return false; window.next.router.push("/admin"); return true; });
  await settle(v.page, 3000);
  const gate = await v.page.evaluate(() => ({ path: location.pathname, disabled: window["ga-disable-G-VWKDNXD9JD"] }));
  check("client-side navigation INTO /admin (GA already running): Google's disable flag switches on", viaRouter && gate.disabled === true, JSON.stringify(gate));
  const pv = await v.manualPv(); check("...and no page_view is sent for the admin page", pv.join(" ") === "/work", pv.join(" "));
  await v.page.getByRole("link", { name: /./ }).first().click({ timeout: 2000 }).catch(() => {});
  check("...and no Google hit left the browser while on /admin", v.t.gaHits === hits || gate.path === "/admin", `hits ${hits}->${v.t.gaHits}`);
  await v.ctx.close(); }

console.log("\nS9  keyboard + mobile");
{ const v = await visitor({ country: "DE", viewport: { width: 390, height: 844 } }); await v.page.goto(BASE + "/work"); await settle(v.page, 3000);
  check("mobile: banner visible and within the viewport", await v.banner().isVisible() && (await v.banner().boundingBox()).y + (await v.banner().boundingBox()).height <= 844 + 1);
  check("mobile: no horizontal overflow", !(await v.page.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
  const sizes = await v.banner().getByRole("button").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  check("buttons are at least 44px tall and equal in size", sizes.every(([, h]) => h >= 44) && sizes[0][0] === sizes[1][0], JSON.stringify(sizes));
  console.log("  aria snapshot:\n" + (await v.banner().ariaSnapshot()).split("\n").map((l) => "     " + l).join("\n"));
  await v.page.screenshot({ path: (process.argv[2] ?? ".") + "/consent-mobile.png" });
  await v.ctx.close(); }
{ const v = await visitor({ country: "DE" }); await v.page.goto(BASE + "/work"); await settle(v.page, 3000);
  await v.page.screenshot({ path: (process.argv[2] ?? ".") + "/consent-desktop.png" });
  await v.page.keyboard.press("Tab"); let reached = false;
  for (let i = 0; i < 60 && !reached; i++) { reached = await v.page.evaluate(() => document.activeElement?.textContent === "Allow"); if (!reached) await v.page.keyboard.press("Tab"); }
  check("Tab reaches the Allow button", reached);
  await v.page.keyboard.press("Tab"); check("then Decline", await v.page.evaluate(() => document.activeElement?.textContent === "Decline"));
  await v.page.keyboard.press("Enter"); await settle(v.page, 800);
  check("Enter on Decline records the choice and removes the banner", !(await v.banner().isVisible()) && v.t.gtagLoads === 0);
  await v.ctx.close(); }
await b.close();
console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL CONSENT CHECKS PASSED");
process.exit(failures ? 1 : 0);
