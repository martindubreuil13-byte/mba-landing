// Browser check for MODE=preview-enabled (email on, allowlist = ADMIN_EMAIL only), against the local mock.
// The admin address gets the success copy; any other address gets the truthful fallback copy AND the immediate download.
import { chromium } from "playwright-core";
import fs from "node:fs";
import { createClient } from "/Users/martin/Documents/The Modern Business Architect (MBA)/mba-site/node_modules/@supabase/supabase-js/dist/index.mjs";

const BASE = "http://localhost:3000";
const ADMIN = process.env.ADMIN_EMAIL;
const PDF = process.env.GUIDE_PDF;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";
const COPY_SENT = "I have also sent a copy to your inbox. If the download does not begin, use the button below.";
const COPY_NOT_SENT = "I could not send the email copy just now, so keep this page open. If the download does not begin, use the button below.";
const out = []; const check = (n, ok, d = "") => out.push(`${ok ? "PASS" : "FAIL"}  [preview-enabled UI] ${n}${ok ? "" : "  -> " + d}`);
const mock = async () => (await fetch("http://127.0.0.1:4010/__sent").then((r) => r.json()));
await fetch("http://127.0.0.1:4010/__reset", { method: "POST" });
// Start from a clean slate for the admin address: a request made in the last 10 minutes (e.g. by the API checks that ran
// before this script) is correctly re-used and answered "already in your inbox", which would mask what is tested here.
const sb = createClient(process.env.API_URL, process.env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
await sb.from("leads").delete().eq("email", ADMIN.toLowerCase());

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
async function submit(email, viewport) {
  const ctx = await browser.newContext({ viewport, acceptDownloads: true, userAgent: UA });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/resources/build-the-bridge-first`, { waitUntil: "networkidle" });
  const cta = page.locator('[data-cta-location="top"]');
  await cta.getByRole("button", { name: /get the printable guide/i }).click();
  await cta.getByLabel("Email address").fill(email);
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), cta.getByRole("button", { name: /send me the guide/i }).click()]);
  const heading = cta.getByRole("heading", { name: "Your printable guide is downloading." });
  await heading.waitFor();
  const result = {
    filename: download.suggestedFilename(),
    identical: fs.readFileSync(await download.path()).equals(fs.readFileSync(PDF)),
    sentCopy: await cta.getByText(COPY_SENT).count(),
    fallbackCopy: await cta.getByText(COPY_NOT_SENT).count(),
    confirmNote: await cta.getByText(/To start receiving community emails/).count(),
    backup: await cta.getByRole("link", { name: /download the pdf/i }).isVisible(),
    focus: await heading.evaluate((el) => el === document.activeElement),
  };
  if (viewport.width === 390) await page.screenshot({ path: `shots/preview-${email === ADMIN ? "admin" : "other"}-mobile.png` });
  await ctx.close();
  return result;
}

const admin = await submit(ADMIN, { width: 1280, height: 900 });
check("admin address: download starts immediately and is the corrected PDF", admin.filename.endsWith(".pdf") && admin.identical);
check("admin address: success copy shown, fallback copy absent", admin.sentCopy === 1 && admin.fallbackCopy === 0);
check("admin address: confirm note shown, backup button present, focus on heading", admin.confirmNote === 1 && admin.backup && admin.focus);

for (const [label, viewport] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const other = await submit(`blocked-${label}-${Date.now().toString(36)}@example.com`, viewport);
  check(`other address (${label}): download STILL starts immediately and is the corrected PDF`, other.filename.endsWith(".pdf") && other.identical);
  check(`other address (${label}): truthful fallback copy shown, "sent" copy absent`, other.fallbackCopy === 1 && other.sentCopy === 0);
  check(`other address (${label}): no confirm note (no email exists to carry the link), backup button present, focus on heading`, other.confirmNote === 0 && other.backup && other.focus);
}

const messages = await mock();
check("the mock received exactly ONE message in total, addressed to ADMIN_EMAIL only", messages.length === 1 && messages[0].to.length === 1 && messages[0].to[0].toLowerCase() === ADMIN.toLowerCase(), JSON.stringify(messages.map((m) => m.to)));
await browser.close();
console.log(out.join("\n"));
const failed = out.filter((x) => x.startsWith("FAIL")).length;
console.log(`\n${out.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
