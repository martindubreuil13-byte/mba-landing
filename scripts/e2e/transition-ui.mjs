// Browser check of the Corporate Transition form against the LOCAL app + mock Resend (needs `playwright-core`
// and a Chrome binary; neither is a repo dependency). Verifies the exact consent wording and what the visitor is
// told after submitting, in both email modes.
//   MODE=production-mock   -> "check your inbox" + one confirmation email in the mock
//   MODE=preview-disabled  -> the truthful "could not send" note and nothing in the mock
import { chromium } from "playwright-core";

const MODE = process.env.MODE ?? "production-mock";
const BASE = process.env.BASE ?? "http://localhost:3000";
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";
const WORDING = "Keep me on Martin’s shortlist for useful ideas, resources and occasional updates. I understand I will get one email asking me to confirm, and I am only subscribed once I do.";
const FOOTNOTE = "Submitting permits transactional messages about this application. It does not subscribe you to marketing unless you check the box and then confirm from the email we send you.";
const SENT_NOTE = /Check your inbox: I have sent one email asking you to confirm/;
const FAILED_NOTE = /I could not send the confirmation email just now, so you are not on the shortlist yet/;
const out = [];
const check = (n, ok, d = "") => out.push(`${ok ? "PASS" : "FAIL"}  [${MODE} UI] ${n}${ok ? "" : "  -> " + d}`);
const run = Date.now().toString(36);
const mock = async () => fetch("http://127.0.0.1:4010/__sent").then((r) => r.json());
await fetch("http://127.0.0.1:4010/__reset", { method: "POST" });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

async function fillForm(page, email, consent, viewport) {
  await page.goto(`${BASE}/transition`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "See if we should talk" }).click();
  const next = () => page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("Manager", { exact: true }).click(); await next();
  await page.getByText("10–15 years", { exact: true }).click(); await next();
  await page.getByText("I know I want to build something of my own, but I don’t have a business idea yet.", { exact: true }).click(); await next();
  await page.getByText("6–12 months", { exact: true }).click(); await next();
  await page.locator("textarea").fill("I want more control over what I do next and to use my experience."); await next();
  await page.locator("textarea").fill("Working out what I could realistically build while employed."); await next();
  await page.getByLabel("Country").fill("Canada"); await next();
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill("Applicant");
  await page.getByLabel("Email address").fill(email);
  return { viewport };
}

for (const [label, viewport] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  for (const consent of [true, false]) {
    const ctx = await browser.newContext({ viewport, userAgent: UA });
    const page = await ctx.newPage();
    const email = `ui-${label}-${consent ? "ticked" : "unticked"}-${run}@example.test`;
    await fillForm(page, email, consent, viewport);

    check(`[${label}, consent ${consent ? "ticked" : "unticked"}] the exact v2 label and footnote are shown beside the checkbox`, await page.getByText(WORDING, { exact: true }).isVisible() && await page.getByText(FOOTNOTE).first().isVisible());
    check(`[${label}, ${consent ? "ticked" : "unticked"}] the checkbox starts unchecked (never pre-ticked)`, !(await page.getByRole("checkbox").isChecked()));
    if (consent) await page.getByRole("checkbox").check();
    if (label === "desktop" && consent) await page.screenshot({ path: `shots/transition-consent-form-${MODE}.png` });
    await page.getByRole("button", { name: "Submit confidentially" }).click();
    await page.getByRole("heading", { name: "Thanks. I’ve got it." }).waitFor({ timeout: 20000 }); // fallback route (REVIEW): no OpenAI is called locally
    if (label === "desktop" && consent) await page.screenshot({ path: `shots/transition-consent-result-${MODE}.png` });

    const sent = await page.getByText(SENT_NOTE).count();
    const failed = await page.getByText(FAILED_NOTE).count();
    if (!consent) {
      check(`[${label}, unticked] no consent note of any kind is shown`, sent === 0 && failed === 0);
    } else if (MODE === "production-mock") {
      check(`[${label}, ticked] tells the visitor to check their inbox to confirm, and not that it failed`, sent === 1 && failed === 0);
    } else {
      check(`[${label}, ticked] truthfully says the confirmation email could not be sent, and not "check your inbox"`, failed === 1 && sent === 0);
    }
    check(`[${label}, ${consent ? "ticked" : "unticked"}] the application itself is acknowledged either way`, await page.getByText("I’ll get back to you by email within 48 hours.").isVisible());
    await ctx.close();
  }
}

const messages = await mock();
if (MODE === "production-mock") {
  const confirmations = messages.filter((m) => m.subject === "Please confirm your email address");
  check("the mock received exactly one confirmation email per TICKED submission (2), none for unticked", confirmations.length === 2 && confirmations.every((m) => m.to[0].includes("-ticked-")), JSON.stringify(confirmations.map((m) => m.to)));
} else {
  check("nothing at all reached the mail provider", messages.length === 0, JSON.stringify(messages.map((m) => m.subject)));
}
await browser.close();
console.log(out.join("\n"));
const failedCount = out.filter((x) => x.startsWith("FAIL")).length;
console.log(`\n${out.length - failedCount} passed, ${failedCount} failed`);
process.exit(failedCount ? 1 : 0);
