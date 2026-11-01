import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Architectural guards for MBA Scheduling. The product has real integrations (Supabase, Google Calendar, Zoom, Resend), and they are
 * allowed to exist ONLY in one place: the adapters. Everything else (rules, UI, pages, public API) is provider-free, so it stays testable and
 * cannot leak a credential or call a vendor. The live Transition flow is independent of all of this.
 */
const ROOT = path.resolve(__dirname, "../../..");
const DIRS = ["app/lib/scheduling", "app/components/scheduling", "app/components/admin/scheduling", "app/book", "app/admin/scheduling", "app/api/scheduling", "app/api/admin/scheduling", "app/scheduling-preview", "app/api/scheduling-preview", "app/api/webhooks/scheduling", "app/api/cron/scheduling-sync"];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.(ts|tsx)$/.test(e.name)) out.push(full);
  }
  return out;
}
// Comments may legitimately NAME what a file avoids ("never touches Supabase"), so scan code only.
const stripComments = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const files = DIRS.flatMap((d) => walk(path.join(ROOT, d))).map((f) => ({ file: path.relative(ROOT, f), text: stripComments(fs.readFileSync(f, "utf8")) }));

const isAdapter = (f: string) => f.startsWith("app/lib/scheduling/adapters/");
const isTestSupport = (f: string) => f.startsWith("app/lib/scheduling/testing/");
/** The only non-adapter files that may import an adapter: the wiring, and the integration endpoints. */
const MAY_IMPORT_ADAPTERS = [/^app\/lib\/scheduling\/instance\.ts$/, /^app\/lib\/scheduling\/integrations\.ts$/, /^app\/api\/admin\/scheduling\/google\//, /^app\/api\/webhooks\/scheduling\//];
const provider = files.filter((f) => !isAdapter(f.file) && !isTestSupport(f.file) && !MAY_IMPORT_ADAPTERS.some((re) => re.test(f.file)));
const offenders = (list: typeof files, re: RegExp) => list.filter((f) => re.test(f.text)).map((f) => f.file);

describe("MBA Scheduling architecture", () => {
  it("finds the scheduling files", () => { expect(files.length).toBeGreaterThan(60); expect(files.filter((f) => isAdapter(f.file)).length).toBeGreaterThanOrEqual(8); });

  describe("providers live only in the adapters", () => {
    it("rules, UI, pages and public routes touch no database client, email client, Google or Zoom, and make no outbound call", () => {
      expect(offenders(provider, /@supabase\/|supabase\/service|supabase\/browser|createClient\(|\b(db|supabase|client)\.from\(/)).toEqual([]);
      expect(offenders(provider, /email-client|createResend|from ["']resend["']|\.emails\.send\(|RESEND_/i)).toEqual([]);
      expect(offenders(provider, /googleapis|google-auth|api\.zoom\.us|zoom\.us\/(v2|oauth)|accounts\.google\.com|oauth2\.googleapis/)).toEqual([]);
      expect(offenders(provider, /fetch\(\s*["'`]https?:/)).toEqual([]);
    });
    it("only the wiring and the integration endpoints import an adapter", () => {
      const importing = files.filter((f) => !isAdapter(f.file) && !isTestSupport(f.file) && /from ["'][^"']*\/adapters\//.test(f.text)).map((f) => f.file);
      expect(importing.filter((f) => !MAY_IMPORT_ADAPTERS.some((re) => re.test(f)))).toEqual([]);
      expect(importing.length).toBeGreaterThan(0);
      // adapters are server-only: never reachable from a client component
      const clientFiles = files.filter((f) => /^"use client"|^'use client'/.test(f.text.trim()));
      expect(clientFiles.filter((f) => /\/adapters\//.test(f.text))).toEqual([]);
    });
    it("the core rules never import an adapter, and adapters never import UI or routes", () => {
      expect(files.filter((f) => /^app\/lib\/scheduling\/[^/]+\.ts$/.test(f.file) && !MAY_IMPORT_ADAPTERS.some((re) => re.test(f.file)) && /\/adapters\//.test(f.text)).map((f) => f.file)).toEqual([]);
      expect(files.filter((f) => isAdapter(f.file) && /app\/(components|api|book|admin|scheduling-preview)\b/.test(f.text)).map((f) => f.file)).toEqual([]);
    });
    it("adapters build no clients of their own: the database client comes from the guarded service helper, email from the policy-checked client", () => {
      const adapters = files.filter((f) => isAdapter(f.file));
      expect(offenders(adapters, /\bcreateClient\(|\bcreateServerClient\(|\bcreateBrowserClient\(|@supabase\/(supabase-js|ssr)/)).toEqual([]);
      expect(offenders(adapters, /from ["']resend["']|new Resend\(/)).toEqual([]);
      expect(adapters.filter((f) => /\.emails\.send\(/.test(f.text) && !/createResend\(/.test(f.text)).map((f) => f.file)).toEqual([]);
    });
    it("contains no embedded credential, key or token", () => {
      expect(offenders(files, /AIza[0-9A-Za-z_-]{20,}|sk_(live|test)_|-----BEGIN [A-Z ]*PRIVATE KEY|ya29\.[0-9A-Za-z_-]{20,}|1\/\/0[0-9A-Za-z_-]{20,}|re_[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9+/=]{10,}/)).toEqual([]);
    });
  });

  describe("configuration", () => {
    it("reads only configuration it owns", () => {
      const allowed = /^(SCHEDULING_[A-Z0-9_]+|NODE_ENV|VERCEL|VERCEL_ENV|CRON_SECRET|RESOURCE_EMAIL_FROM)$/;
      const uses = files.filter((f) => !isTestSupport(f.file)).flatMap((f) => [...f.text.matchAll(/process\.env\.([A-Z0-9_]+)|\benv\.([A-Z0-9_]+)/g)].map((m) => ({ f: f.file, name: m[1] ?? m[2] })));
      expect(uses.filter((u) => !allowed.test(u.name)).map((u) => `${u.f}:${u.name}`)).toEqual([]);
    });
    it("test support (which reads a local env file) is never imported by application code", () => {
      expect(files.filter((f) => !isTestSupport(f.file) && /\/testing\//.test(f.text)).map((f) => f.file)).toEqual([]);
    });
    it("only the wiring, the adapters and the endpoints read credentials; pages and components never do", () => {
      const credential = /SCHEDULING_(GOOGLE_CLIENT|ZOOM_(ACCOUNT|CLIENT)|TOKEN_KEY|[A-Z_]*SECRET)|CRON_SECRET/;
      const holders = files.filter((f) => credential.test(f.text)).map((f) => f.file);
      expect(holders.filter((f) => /^app\/(components|book|admin|scheduling-preview)\//.test(f))).toEqual([]);
      expect(holders.length).toBeGreaterThan(0);
    });
    it("integrations are never live by default: the mode switches default to mock and simulated", () => {
      const wiring = files.find((f) => f.file === "app/lib/scheduling/integrations.ts")!.text;
      expect(wiring).toMatch(/SCHEDULING_GOOGLE === "live"/); expect(wiring).toMatch(/SCHEDULING_ZOOM === "live"/);
      expect(wiring).toMatch(/SCHEDULING_EMAIL === "resend"/); expect(wiring).toMatch(/SCHEDULING_BACKEND === "supabase"/);
    });
  });

  describe("the live Transition flow is independent", () => {
    it("imports nothing from the Transition program, its Calendly link or its booking helper (only the shared email SHELL, in one adapter)", () => {
      expect(offenders(files, /calendly|lib\/booking["']|INTRO_BOOKING_URL|programs\/(corporate-transition|queries|invitation|calendly|classify|community|receipt)/i)).toEqual([]);
      expect(files.filter((f) => /programs\//.test(f.text)).map((f) => f.file)).toEqual(["app/lib/scheduling/adapters/resend-email.ts"]);
    });
  });

  describe("nothing is reachable unless the prototype is on", () => {
    it("every API route is wrapped by the prototype switch, the admin check, the dev-only preview switch or the webhook verifier", () => {
      const routes = files.filter((f) => /\/route\.ts$/.test(f.file));
      expect(routes.length).toBeGreaterThanOrEqual(12);
      for (const r of routes) expect(r.text, r.file).toMatch(/\b(publicRoute|adminRoute|previewRoute|webhookRoute|cronRoute)\b/);
      for (const r of routes.filter((x) => x.file.startsWith("app/api/admin/scheduling/"))) expect(r.text, r.file).toContain("adminRoute");
      for (const r of routes.filter((x) => x.file.startsWith("app/api/scheduling-preview/"))) expect(r.text, r.file).toContain("previewRoute");
    });
    it("every public page and layout checks the prototype switch, and admin pages also require the admin", () => {
      for (const f of files.filter((x) => /app\/book\/.*(page|layout)\.tsx$/.test(x.file))) expect(f.text, f.file).toMatch(/requireScheduling(?:Operations|Intake)\(\)/);
      for (const f of files.filter((x) => /app\/admin\/scheduling\/.*page\.tsx$/.test(x.file))) expect(f.text, f.file).toMatch(/adminSchedulingContext\(\)/);
      const layout = files.find((x) => x.file === "app/admin/scheduling/layout.tsx")!;
      expect(layout.text).toMatch(/requireScheduling(?:Operations|Intake)\(\)/);
      expect(layout.text).toMatch(/requireAdmin\(\)/);
    });
    it("the preview is guarded on every page and shares the real admin's components", () => {
      const pages = files.filter((x) => /^app\/scheduling-preview\/.*page\.tsx$/.test(x.file));
      expect(pages.length).toBeGreaterThanOrEqual(7);
      for (const f of pages) { expect(f.text, f.file).toMatch(/previewSchedulingContext\(\)/); expect(f.text, f.file).toMatch(/components\/admin\/scheduling\/views\//); }
      expect(files.find((x) => x.file === "app/scheduling-preview/layout.tsx")!.text).toMatch(/requireSchedulingPreview\(\)/);
      for (const f of files.filter((x) => /^app\/admin\/scheduling\/.*page\.tsx$/.test(x.file))) expect(f.text, f.file).toMatch(/components\/admin\/scheduling\/views\//);
    });
    it("the preview has no route to authentication, privileged admin APIs, any database or any provider", () => {
      const preview = files.filter((f) => /^app\/(scheduling-preview|api\/scheduling-preview)\//.test(f.file) || ["app/lib/scheduling/preview.ts", "app/lib/scheduling/preview-route.ts", "app/lib/scheduling/preview-page.ts", "app/lib/scheduling/http-shared.ts"].includes(f.file));
      expect(preview.length).toBeGreaterThan(10);
      for (const f of preview) {
        expect(f.text, f.file).not.toMatch(/admin-session|getAdminUser|requireAdmin|adminRoute|supabase|AdminShell|\/api\/admin\//i);
        expect(f.text, f.file).not.toMatch(/lib\/scheduling\/http["']/);
        expect(f.text, f.file).not.toMatch(/\/adapters\//);
      }
    });
    it("the prototype never runs on Vercel, even with the flag set", async () => {
      const { schedulingPrototypeEnabled } = await import("./prototype");
      expect(schedulingPrototypeEnabled({ SCHEDULING_PROTOTYPE: "true" })).toBe(true);
      expect(schedulingPrototypeEnabled({ SCHEDULING_PROTOTYPE: "true", VERCEL: "1" })).toBe(false);
      expect(schedulingPrototypeEnabled({ SCHEDULING_PROTOTYPE: "true", VERCEL_ENV: "production" })).toBe(false);
      expect(schedulingPrototypeEnabled({})).toBe(false);
      expect(schedulingPrototypeEnabled({ SCHEDULING_PROTOTYPE: "1" })).toBe(false);
    });
  });
});
