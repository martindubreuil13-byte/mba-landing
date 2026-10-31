import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static guards for the Publications feature: they read the source and fail if a future change opens a door that
 * the runtime tests would not notice (an unauthenticated admin route, a public query that leaks a private column,
 * a fetch of an admin-supplied URL, the Resources feature being touched).
 */
const ROOT = path.resolve(__dirname, "../../..");
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), "utf8");
const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) out.push(rel);
  }
  return out;
};

const adminRoutes = walk("app/api/admin/publications").filter((f) => f.endsWith("route.ts"));

describe("admin endpoints authenticate before anything privileged", () => {
  it("there are admin routes to check", () => {
    expect(adminRoutes.length).toBeGreaterThanOrEqual(6);
  });
  it("every method of every route is wrapped in withPublicationsAdmin", () => {
    for (const file of adminRoutes) {
      const text = read(file);
      const exported = [...text.matchAll(/export (?:const|async function|function) (GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]);
      expect(exported.length, file).toBeGreaterThan(0);
      for (const method of exported) expect(text, `${file} ${method}`).toMatch(new RegExp(`export const ${method} = withPublicationsAdmin`));
      expect(text, file).not.toMatch(/getServiceClient|createClient/);
    }
  });
  it("the wrapper calls getAdminUser first and checks the origin before invoking the handler", () => {
    const text = read("app/lib/publications/admin-route.ts");
    const auth = text.indexOf("getAdminUser()");
    const origin = text.indexOf("isSameOriginRequest(");
    const handler = text.indexOf("await handler(");
    expect(auth).toBeGreaterThan(-1);
    expect(auth).toBeLessThan(origin);
    expect(origin).toBeLessThan(handler);
  });
  it("admin pages require the admin before loading anything", () => {
    for (const file of walk("app/admin/publications").filter((f) => f.endsWith("page.tsx"))) {
      const text = read(file);
      const guard = text.indexOf("await requireAdmin()");
      expect(guard, file).toBeGreaterThan(-1);
      const firstQuery = text.search(/await (list|get)[A-Z]\w*\(/);
      if (firstQuery >= 0) expect(guard, file).toBeLessThan(firstQuery);
    }
  });
});

describe("the public side can only see published, public columns", () => {
  const queries = read("app/lib/publications/queries.ts");
  const publicColumns = queries.match(/const PUBLIC_COLUMNS =\s*"([^"]+)"/)![1];
  it("the public projection is explicit and carries no private or admin-only column", () => {
    expect(publicColumns).not.toContain("*");
    for (const secret of ["cover_source_path", "revision", "published_at", "sort_order", "created_at"]) expect(publicColumns).not.toContain(secret);
  });
  it("no query selects with *", () => {
    expect(queries).not.toMatch(/\.select\(\s*["'`]\*/);
  });
  it("every public read filters on published = true", () => {
    for (const fn of ["listPublishedPublications", "getPublishedPublicationBySlug", "getFeaturedPublication", "listPublishedForSitemap", "getPublishedRaw"]) {
      const body = queries.slice(queries.indexOf(`function ${fn}`));
      const end = body.indexOf("\n}\n");
      expect(body.slice(0, end), fn).toMatch(/\.eq\("published", true\)/);
    }
  });
  it("public pages import only the public reads", () => {
    for (const file of ["app/page.tsx", "app/publications/page.tsx", "app/publications/[slug]/page.tsx", "app/publications/[slug]/og/route.tsx", "app/sitemap-data.ts"]) {
      const imports = [...read(file).matchAll(/import \{([^}]+)\} from "@\/app\/lib\/publications\/queries"/g)].flatMap((m) => m[1].split(",").map((s) => s.trim()));
      for (const name of imports) expect(["getFeaturedPublication", "listPublishedPublications", "getPublishedPublicationBySlug", "getPublishedCoverPathBySlug", "listPublishedForSitemap"], `${file} imports ${name}`).toContain(name);
    }
  });
  it("an unknown or unpublished slug is a 404 in both the page and its metadata", () => {
    const page = read("app/publications/[slug]/page.tsx");
    expect(page.match(/if \(!p\) notFound\(\)|if \(!publication\) notFound\(\)/g)?.length).toBe(2);
  });
});

describe("retailer URLs are never fetched", () => {
  it("nothing in the publications code or components fetches a URL", () => {
    const files = [...walk("app/lib/publications"), ...walk("app/components/publications")];
    for (const file of files) expect(read(file), file).not.toMatch(/\bfetch\(|https?\.request|axios|undici/);
  });
});

describe("Resources and its storage rules are untouched", () => {
  it("the publications code never writes to Resource tables or to Resource covers outside its own prefix", () => {
    const text = walk("app/lib/publications").map(read).join("\n");
    expect(text).not.toMatch(/from\("(resources|leads|resource_requests|resource_events|consent_records)"\)/);
    expect(text).not.toMatch(/resource-files/);
    // The shared public bucket is only ever addressed under publications/<id>/
    expect(read("app/lib/publications/storage.ts")).toMatch(/publications\/\$\{id\}\//);
  });
  it("the Resources source tree has no reference to publications", () => {
    for (const file of [...walk("app/lib/resources"), ...walk("app/components/resources"), ...walk("app/api/resources"), ...walk("app/admin/resources")]) {
      expect(read(file), file).not.toMatch(/publications/i);
    }
  });
});

describe("navigation", () => {
  it("Publications follows Thinking in the primary navigation and has a section label", () => {
    const nav = read("app/components/Navigation.tsx");
    expect(nav.indexOf('label: "THINKING"')).toBeLessThan(nav.indexOf('label: "PUBLICATIONS"'));
    expect(nav.indexOf('label: "PUBLICATIONS"')).toBeLessThan(nav.indexOf('label: "LET\'S TALK"'));
    expect(nav).toMatch(/startsWith\("\/publications"\)\) return "PUBLICATIONS"/);
  });
  it("both footers link to Publications", () => {
    expect(read("app/components/Footer.tsx").match(/href="\/publications"/g)?.length).toBe(2);
  });
});

describe("homepage", () => {
  it("renders the feature only when a featured publication exists, and never hard-codes a title", () => {
    const page = read("app/page.tsx");
    expect(page).toMatch(/\{featured \? <FeaturedPublication publication=\{featured\} \/> : null\}/);
    expect(page).not.toMatch(/Architecting Intelligence/i);
    expect(read("app/components/publications/FeaturedPublication.tsx")).not.toMatch(/Architecting Intelligence/i);
  });
  it("keeps the hero CTA and the reduced-motion handling", () => {
    const hero = read("app/components/home/HomeHero.tsx");
    expect(hero).toMatch(/href="\/work"/);
    expect(hero).toMatch(/prefers-reduced-motion/);
  });
});
