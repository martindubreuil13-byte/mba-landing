// Browser check for MODE=preview-enabled (email on, allowlist = ADMIN_EMAIL only), against the local mock.
// The admin address gets the neutral "check your inbox" state; any other address is refused and told so plainly.
// In neither case does a download start or appear: nothing unlocks before the membership is confirmed.
import { chromium } from "playwright-core";
import { createClient } from "/Users/martin/Documents/The Modern Business Architect (MBA)/mba-site/node_modules/@supabase/supabase-js/dist/index.mjs";

const BASE = "http://localhost:3000";
const ADMIN = process.env.ADMIN_EMAIL;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";
const out = []; const check = (n, ok, d = "") => out.push(`${ok ? "PASS" : "FAIL"}  [preview-enabled UI] ${n}${ok ? "" : "  -> " + d}`);
const mock = async () => (await fetch("http://127.0.0.1:4010/__sent").then((r) => r.json()));
await fetch("http://127.0.0.1:4010/__reset", { method: "POST" });
// Clean slate for the admin address: a request made in the last 10 minutes is correctly re-used and would mask what is tested here.
const sb = createClient(process.env.API_URL, process.env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
await sb.from("leads").delete().eq("email", ADMIN.toLowerCase());

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
async function submit(email, viewport) {
  const ctx = await browser.newContext({ viewport, acceptDownloads: true, userAgent: UA });
  const page = await ctx.newPage();
  const downloads = [];
  page.on("download", (d) => downloads.push(d));
  await page.goto(`${BASE}/resources/build-the-bridge-first`, { waitUntil: "networkidle" });
  const cta = page.locator('[data-cta-location="top"]');
  await cta.getByRole("button", { name: /unlock the printable guide/i }).click();
  await cta.getByLabel("Email address").fill(email);
  await cta.getByRole("button", { name: /email me a confirmation link/i }).click();
  await page.waitForTimeout(2500);
  const state = { checkInbox: await cta.getByRole("heading", { name: "Check your inbox" }).count(), error: await cta.getByRole("alert").filter({ hasText: /could not send the email/i }).count(), downloads: downloads.length, source: await page.content() };
  await ctx.close();
  return state;
}

for (const [name, viewport] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const mine = await submit(ADMIN, viewport);
  check(`[${name}] the admin address gets the neutral check-your-inbox state`, mine.checkInbox === 1 && mine.error === 0);
  const other = await submit(`delivered+someone-${name}-${Date.now().toString(36)}@resend.dev`, viewport);
  check(`[${name}] any other address is told plainly the email could not be sent (not 'check your inbox')`, other.error === 1 && other.checkInbox === 0);
  check(`[${name}] no download starts and no download link is in the page, in either case`, mine.downloads === 0 && other.downloads === 0 && !/api\/resources\/download/.test(mine.source + other.source));
}
const sent = await mock();
check("the mock received messages only for the admin address", sent.length >= 1 && sent.every((m) => m.to.every((t) => t.toLowerCase() === ADMIN.toLowerCase())), JSON.stringify(sent.map((m) => m.to)));
await browser.close();
console.log(out.join("\n"));
const failed = out.filter((x) => x.startsWith("FAIL")).length;
console.log(`\n${out.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
