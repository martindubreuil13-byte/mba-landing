// Verifies that "Analytics preferences" is reachable and works on EVERY public page, before and after a decision, with a mouse, with the
// keyboard, and with touch on a phone-sized viewport. Same requirements and safety rules as consent-e2e.mjs (production-mode build served on
// localhost against an isolated database; all outgoing Google Analytics requests are aborted).
//   node docs/website-intelligence/e2e/consent-pages-e2e.mjs <output-dir>
import { chromium, devices } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3101";
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE)) throw new Error("Refusing to run against a non-local BASE");
const OUT = process.argv[2] ?? ".";
const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), headless: true });
let failures = 0;
const check = (name, ok, extra = "") => { if (!ok) failures++; if (!ok || process.env.VERBOSE) console.log(`${ok ? "  ok " : "  FAIL"} ${name}${extra ? "  [" + extra + "]" : ""}`); };
const PAGES = ["/", "/work", "/work/pre-architecture", "/martin", "/cases", "/cases/kill-it", "/lets-talk", "/resources", "/resources/business-idea-reality-check", "/resources/napkin-principle", "/privacy", "/thinking", "/thinking/architecting-intelligence", "/answers", "/answers/what-is-business-architecture", "/transition", "/this-page-does-not-exist"];

const phone = { ...devices["iPhone 13"] };
const profiles = { desktop: { viewport: { width: 1280, height: 800 } }, "phone (touch)": { ...phone } };

async function newVisitor(profile, country) {
  const ctx = await b.newContext({ ...profile, extraHTTPHeaders: { "x-vercel-ip-country": country } });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  const t = { hits: 0, loads: 0 };
  await ctx.route(/(google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com|google\.com\/(ccm|pagead))/, (r) => { if (new URL(r.request().url()).pathname.includes("/collect")) t.hits++; r.abort(); });
  await ctx.route(/googletagmanager\.com/, (r) => { t.loads++; r.continue(); });
  const page = await ctx.newPage();
  return { ctx, page, t };
}
const region = (p) => p.getByRole("region", { name: /Google Analytics|Analytics preferences/ });
const prefsButton = (p) => p.getByRole("button", { name: "Analytics preferences" });
const gaCookies = async (ctx) => (await ctx.cookies()).filter((c) => c.name === "_ga" || c.name.startsWith("_ga_")).length;
const until = async (fn, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await fn()) return true; await new Promise((r) => setTimeout(r, 200)); } return false; };
const tap = async (page, loc, touch) => (touch ? loc.tap() : loc.click());

for (const [pname, profile] of Object.entries(profiles)) {
  const touch = pname.startsWith("phone");
  console.log(`\n== ${pname}: the control exists and works on every public page (visitor in Germany, decision already made = Declined)`);
  const v = await newVisitor(profile, "DE");
  await v.page.goto(BASE + "/work"); await v.page.waitForTimeout(2000);
  await tap(v.page, region(v.page).getByRole("button", { name: "Decline" }), touch); await v.page.waitForTimeout(500);
  for (const path of PAGES) {
    await v.page.goto(BASE + path); await v.page.waitForTimeout(900);
    const btn = prefsButton(v.page);
    const count = await btn.count();
    check(`${path}: control present`, count >= 1);
    if (!count) continue;
    await tap(v.page, btn.first(), touch); await v.page.waitForTimeout(250);
    const open = await region(v.page).isVisible();
    check(`${path}: opens the panel`, open);
    if (!open) continue;
    const text = await region(v.page).innerText();
    check(`${path}: panel states the current choice and links the privacy notice`, /You declined Google Analytics/.test(text) && /Privacy notice/.test(text));
    const box = await region(v.page).boundingBox(); const vp = v.page.viewportSize();
    check(`${path}: panel fits the screen, no horizontal overflow`, box.x >= -1 && box.x + box.width <= vp.width + 1 && !(await v.page.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
    const sizes = await region(v.page).getByRole("button").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
    check(`${path}: buttons at least 44px tall`, sizes.every(([, h]) => h >= 44), JSON.stringify(sizes));
    await v.page.keyboard.press("Escape"); await v.page.waitForTimeout(200);
    check(`${path}: Escape closes it`, !(await region(v.page).isVisible()));
    if (!touch) check(`${path}: focus returns to the control`, await v.page.evaluate(() => document.activeElement?.textContent === "Analytics preferences"));
  }
  check("never loaded Google, set a cookie or sent a hit while declined", v.t.loads === 0 && v.t.hits === 0 && (await gaCookies(v.ctx)) === 0);
  await v.ctx.close();

  console.log(`\n== ${pname}: change of mind from the homepage (Allow, then withdraw)`);
  const w = await newVisitor(profile, "DE");
  await w.page.goto(BASE + "/"); await w.page.waitForTimeout(2500);
  check("homepage (undecided): banner shown, nothing loaded", (await region(w.page).isVisible()) && w.t.loads === 0 && (await gaCookies(w.ctx)) === 0);
  await w.page.screenshot({ path: `${OUT}/home-banner-${touch ? "phone" : "desktop"}.png` });
  await tap(w.page, region(w.page).getByRole("button", { name: "Allow" }), touch);
  check("Allow starts Google Analytics (cookies set)", await until(async () => (await gaCookies(w.ctx)) >= 1));
  await w.page.reload(); await w.page.waitForTimeout(2500);
  check("homepage after the decision: no banner, but the control is still there", !(await region(w.page).isVisible()) && (await prefsButton(w.page).count()) >= 1);
  const strip = prefsButton(w.page).first(); await strip.scrollIntoViewIfNeeded();
  await w.page.screenshot({ path: `${OUT}/home-strip-${touch ? "phone" : "desktop"}.png` });
  await tap(w.page, strip, touch); await w.page.waitForTimeout(250);
  check("opens and says Google Analytics is allowed", /You allowed Google Analytics|is on for this visit/.test(await region(w.page).innerText()));
  const hitsBefore = w.t.hits;
  await tap(w.page, region(w.page).getByRole("button", { name: "Decline" }), touch); await w.page.waitForTimeout(800);
  check("withdrawal removes the cookies", (await gaCookies(w.ctx)) === 0);
  await w.page.goto(BASE + "/answers"); await w.page.waitForTimeout(2500);
  check("and nothing more is sent to Google afterwards", w.t.hits === hitsBefore);
  await w.ctx.close();
}

console.log("\n== keyboard only (desktop): Tab to the homepage control, open, choose, return");
{ const v = await newVisitor(profiles.desktop, "US");
  await v.page.goto(BASE + "/"); await v.page.waitForTimeout(3500);
  let reached = false; for (let i = 0; i < 80 && !reached; i++) { await v.page.keyboard.press("Tab"); reached = await v.page.evaluate(() => document.activeElement?.textContent === "Analytics preferences"); }
  check("Tab reaches 'Analytics preferences' on the homepage", reached);
  await v.page.keyboard.press("Enter"); await v.page.waitForTimeout(250);
  check("Enter opens the panel and moves focus into it", (await region(v.page).isVisible()) && (await v.page.evaluate(() => document.activeElement?.getAttribute("aria-labelledby") === "analytics-choice-title")));
  const focused = () => v.page.evaluate(() => document.activeElement?.textContent);
  await v.page.keyboard.press("Tab"); check("Tab order follows reading order: privacy link first", (await focused()) === "Privacy notice");
  await v.page.keyboard.press("Tab"); check("then Allow", (await focused()) === "Allow");
  await v.page.keyboard.press("Tab"); check("then Decline", (await focused()) === "Decline");
  await v.page.keyboard.press("Tab"); check("then Close", (await focused()) === "Close");
  await v.page.keyboard.press("Shift+Tab"); await v.page.keyboard.press("Enter"); await v.page.waitForTimeout(600);
  check("(Shift+Tab back to Decline) Enter applies it and closes", !(await region(v.page).isVisible()) && (await gaCookies(v.ctx)) === 0);
  await v.ctx.close();
}
{ const v = await newVisitor(profiles.desktop, "US");
  await v.page.goto(BASE + "/"); await v.page.waitForTimeout(3500);
  await prefsButton(v.page).first().scrollIntoViewIfNeeded(); await prefsButton(v.page).first().focus(); await v.page.keyboard.press("Enter"); await v.page.waitForTimeout(250);
  await v.page.keyboard.press("Escape"); await v.page.waitForTimeout(200);
  check("Escape closes and returns focus to the control (keyboard)", !(await region(v.page).isVisible()) && (await v.page.evaluate(() => document.activeElement?.textContent === "Analytics preferences")));
  await v.ctx.close(); }

await b.close();
console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL PAGE/MOBILE CONSENT CHECKS PASSED");
process.exit(failures ? 1 : 0);
