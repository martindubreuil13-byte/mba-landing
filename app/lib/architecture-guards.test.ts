import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static guards for the preview safeguards. They read the source tree and fail if code bypasses
 * the single choke points (email policy, database guard, environment-aware links), so a future
 * change cannot silently reopen a hole that the runtime tests would not notice.
 */
const ROOT = path.resolve(__dirname, "../..");

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (/\.(ts|tsx|mjs)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const rel = (file: string) => path.relative(ROOT, file).split(path.sep).join("/");
const read = (file: string) => fs.readFileSync(file, "utf8");
const appFiles = [...sourceFiles(path.join(ROOT, "app")), path.join(ROOT, "proxy.ts"), path.join(ROOT, "next.config.ts")];
const withText = appFiles.map((file) => ({ file: rel(file), text: read(file) }));
const offenders = (pattern: RegExp, allowed: string[]) =>
  withText.filter(({ file, text }) => pattern.test(text) && !allowed.includes(file)).map(({ file }) => file);

describe("email goes through the central policy client", () => {
  it("only email-client.ts imports or constructs Resend", () => {
    expect(offenders(/from ["']resend["']|require\(["']resend["']\)|new Resend\(/, ["app/lib/email-client.ts"])).toEqual([]);
  });
  it("no other mail transport or direct provider call exists", () => {
    expect(offenders(/api\.resend\.com|nodemailer|@sendgrid|postmark|mailgun|createTransport/i, [])).toEqual([]);
  });
  it("every file that calls emails.send takes its client from createResend", () => {
    const callers = withText.filter(({ file, text }) => /\.emails\.send\(/.test(text) && file !== "app/lib/email-client.ts");
    expect(callers.length).toBeGreaterThan(0);
    for (const { file, text } of callers) expect(text, file).toMatch(/createResend\(/);
  });
});

describe("every Supabase access path is behind the production-database guard", () => {
  const CLIENT_FILES = ["app/lib/supabase/service.ts", "app/lib/supabase/admin-session.ts", "app/lib/supabase/browser.ts", "proxy.ts"];
  it("clients are constructed only in the four guarded files", () => {
    expect(offenders(/\bcreateClient\(|\bcreateServerClient\(|\bcreateBrowserClient\(/, CLIENT_FILES)).toEqual([]);
    expect(offenders(/@supabase\/(supabase-js|ssr)/, CLIENT_FILES)).toEqual([]);
  });
  it("each of those files checks the guard before it builds a client", () => {
    for (const file of CLIENT_FILES) {
      const text = read(path.join(ROOT, file));
      const guard = text.search(/assertDatabaseAllowed(ForDeployment)?\(|isProductionDatabaseUrl\(/);
      const construct = text.search(/\bcreateClient\(|\bcreateServerClient\(|\bcreateBrowserClient\(/);
      expect(guard, `${file} has no guard`).toBeGreaterThanOrEqual(0);
      expect(guard, `${file} constructs a client before guarding`).toBeLessThan(construct);
    }
  });
  it("the project URL is not used anywhere else (no direct REST/storage calls around the guard)", () => {
    expect(offenders(/NEXT_PUBLIC_SUPABASE_URL|\.supabase\.co/, [...CLIENT_FILES, "app/lib/deployment.ts"])).toEqual([]);
  });
});

describe("operational links use the environment-aware base URL", () => {
  it("SITE_URL / the canonical domain never appears in api or lib code except the SEO module and the base-URL helper", () => {
    const operational = withText.filter(({ file }) => /^app\/(api|lib)\//.test(file) && !["app/lib/seo.ts", "app/lib/resources/base-url.ts"].includes(file));
    const bad = operational.filter(({ text }) => /\bSITE_URL\b|https?:\/\/(www\.)?modernbusinessarchitect\.com/.test(text)).map(({ file }) => file);
    expect(bad).toEqual([]);
  });
  it("links in emails are built with appBaseUrl()", () => {
    for (const file of ["app/lib/programs/email.ts", "app/lib/napkin/email.ts", "app/api/resources/request/route.ts", "app/api/assessment/submit/route.ts", "app/api/pick-my-brain/ask/route.ts"]) {
      expect(read(path.join(ROOT, file)), file).toMatch(/appBaseUrl\(\)/);
    }
  });
});

describe("analytics and indexing are production-only", () => {
  const layout = read(path.join(ROOT, "app/layout.tsx"));
  it("Google Analytics is rendered only inside the production branch", () => {
    expect(layout.match(/googletagmanager\.com/g)?.length).toBe(1);
    expect(layout.indexOf("isProduction ?")).toBeGreaterThan(-1);
    expect(layout.indexOf("isProduction ?")).toBeLessThan(layout.indexOf("googletagmanager.com"));
  });
  it("next.config sends X-Robots-Tag outside production and bakes in the build-time deployment", () => {
    const config = read(path.join(ROOT, "next.config.ts"));
    expect(config).toMatch(/X-Robots-Tag/);
    expect(config).toMatch(/NEXT_PUBLIC_DEPLOYMENT_ENV/);
  });
  it("robots.txt and the sitemap short-circuit outside production", () => {
    expect(read(path.join(ROOT, "app/robots.ts"))).toMatch(/!isProductionDeployment\(\)/);
    expect(read(path.join(ROOT, "app/sitemap.ts"))).toMatch(/!isProductionDeployment\(\)\) return \[\]/);
  });
});
