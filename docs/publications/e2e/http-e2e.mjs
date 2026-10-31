// Publications: HTTP-level checks against a RUNNING LOCAL server (default http://localhost:3000) and the LOCAL Supabase.
//   set -a; source .env.development.local; set +a
//   node docs/publications/e2e/http-e2e.mjs
// Refuses to run against anything but localhost. Synthetic fixtures only ("ZZ E2E ..."); all removed at the end.
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import sharp from "sharp";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!/^http:\/\/(localhost|127\.0\.0\.1)/.test(BASE) || !/^http:\/\/(localhost|127\.0\.0\.1)/.test(SB)) throw new Error("local only");
const run = Date.now().toString(36);
const service = createClient(SB, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const results = [];
const check = (name, ok, detail = "") => { results.push(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`); };
const eq = (name, got, want) => check(name, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);

async function session(email, password) {
  const jar = new Map();
  const client = createServerClient(SB, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (c) => c.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
}
const api = (cookie, path, { method = "GET", json, form, headers = {}, origin = BASE } = {}) =>
  fetch(BASE + path, {
    method, redirect: "manual",
    headers: { ...(cookie ? { cookie } : {}), ...(origin ? { origin, "sec-fetch-site": "same-origin" } : {}), ...(json !== undefined ? { "content-type": "application/json" } : {}), ...headers },
    body: form ?? (json !== undefined ? JSON.stringify(json) : undefined),
  });
const j = async (res) => ({ status: res.status, body: await res.json().catch(() => ({})) });
const png = (w = 900, h = 1350, bg = "#6b1f1f") => sharp({ create: { width: w, height: h, channels: 3, background: bg } }).png().toBuffer();
const upload = (cookie, id, rev, buf, type = "image/png", name = "cover.png") => {
  const f = new FormData(); f.set("file", new File([buf], name, { type })); f.set("expectedRevision", String(rev));
  return api(cookie, `/api/admin/publications/${id}/cover`, { method: "POST", form: f });
};
const listObjects = async (bucket, id) => {
  const s = service.storage.from(bucket); const { data: vs } = await s.list(`publications/${id}`); const out = [];
  for (const v of vs ?? []) { const { data: fs } = await s.list(`publications/${id}/${v.name}`); for (const f of fs ?? []) out.push(f.name); }
  return out;
};
const created = [];
const adminEmail = process.env.ADMIN_EMAIL;
const nonAdminEmail = `zz-e2e-nonadmin-${run}@example.test`, nonAdminPw = "Local-E2E-Nonadmin-1";
await service.auth.admin.createUser({ email: nonAdminEmail, password: nonAdminPw, email_confirm: true });
const priorFeatured = (await service.from("publications").select("id").eq("featured", true).maybeSingle()).data?.id ?? null;

try {
  const admin = await session(adminEmail, process.env.LOCAL_ADMIN_PASSWORD);
  const nonAdmin = await session(nonAdminEmail, nonAdminPw);

  // ---------- A. authentication / authorization ----------
  const probes = [["POST", "/api/admin/publications", { title: "x" }], ["PATCH", "/api/admin/publications/00000000-0000-0000-0000-000000000000", { expectedRevision: 1, title: "x" }],
    ["DELETE", "/api/admin/publications/00000000-0000-0000-0000-000000000000", { expectedRevision: 1 }], ["POST", "/api/admin/publications/reorder", { expected: [], order: [] }],
    ["POST", "/api/admin/publications/00000000-0000-0000-0000-000000000000/status", { action: "publish", expectedRevision: 1 }],
    ["POST", "/api/admin/publications/00000000-0000-0000-0000-000000000000/feature", { featured: true }],
    ["DELETE", "/api/admin/publications/00000000-0000-0000-0000-000000000000/cover", { expectedRevision: 1 }]];
  for (const [label, cookie] of [["signed-out", null], ["non-admin user", nonAdmin]]) {
    const codes = []; for (const [method, path, json] of probes) codes.push((await api(cookie, path, { method, json })).status);
    eq(`A1 ${label}: every admin endpoint returns 401`, codes, probes.map(() => 401));
    const f = new FormData(); f.set("file", new File([await png()], "c.png", { type: "image/png" })); f.set("expectedRevision", "1");
    eq(`A2 ${label}: cover upload returns 401 before any parsing`, (await api(cookie, "/api/admin/publications/00000000-0000-0000-0000-000000000000/cover", { method: "POST", form: f })).status, 401);
    for (const page of ["/admin/publications", "/admin/publications/new", "/admin/publications/00000000-0000-0000-0000-000000000000/edit", "/admin/publications/00000000-0000-0000-0000-000000000000/preview"]) {
      const r = await api(cookie, page); check(`A3 ${label}: ${page} redirects to the login`, r.status === 307 && new URL(r.headers.get("location"), BASE).pathname === "/admin", `${r.status} ${r.headers.get("location")}`);
    }
  }
  eq("A4 admin without an Origin header is refused (403)", (await api(admin, "/api/admin/publications", { method: "POST", json: { title: "x" }, origin: null })).status, 403);
  eq("A5 admin with a foreign Origin is refused (403)", (await api(admin, "/api/admin/publications", { method: "POST", json: { title: "x" }, origin: "https://evil.example" })).status, 403);
  eq("A6 admin with cross-site fetch metadata is refused (403)", (await api(admin, "/api/admin/publications", { method: "POST", json: { title: "x" }, headers: { "sec-fetch-site": "cross-site" } })).status, 403);

  // ---------- B. create + validation ----------
  const c1 = await j(await api(admin, "/api/admin/publications", { method: "POST", json: { title: `ZZ E2E Alpha ${run}` } }));
  eq("B1 create a minimal draft", c1.status, 201); const A = c1.body.publication; created.push(A.id);
  check("B2 slug derived from the title, draft, revision 1", A.slug === `zz-e2e-alpha-${run}` && A.published === false && A.revision === 1, JSON.stringify(A));
  eq("B3 duplicate slug is a field error (409)", (await j(await api(admin, "/api/admin/publications", { method: "POST", json: { title: "Other", slug: A.slug } }))).body.fieldErrors?.slug !== undefined, true);
  eq("B4 oversized JSON body is refused (413)", (await api(admin, "/api/admin/publications", { method: "POST", json: { title: "x".repeat(100_000) } })).status, 413);
  const body = (extra) => ({ title: A.title, slug: A.slug, expectedRevision: A.revision, ...extra });
  const patch = async (extra, rev = A.revision) => j(await api(admin, `/api/admin/publications/${A.id}`, { method: "PATCH", json: { ...body(extra), expectedRevision: rev } }));
  for (const [label, url] of [["http", "http://shop.com/x"], ["javascript:", "javascript:alert(1)"], ["credentials", "https://u:p@shop.com/x"], ["custom port", "https://shop.com:8443/x"], ["localhost", "https://localhost/x"], ["IPv4", "https://10.1.2.3/x"], ["metadata IP", "https://169.254.169.254/x"], ["IPv6", "https://[::1]/x"], ["data:", "data:text/html,hi"]]) {
    const r = await patch({ retailers: [{ name: "Shop", url }] }); check(`B5 retailer URL rejected: ${label}`, r.status === 422 && !!r.body.fieldErrors?.retailers, JSON.stringify(r));
  }
  eq("B6 bad ISBN rejected", (await patch({ editions: [{ format: "Paperback", isbn: "9780306406158" }] })).status, 422);
  eq("B7 external related link rejected", (await patch({ related: ["https://evil.example/x"] })).status, 422);
  eq("B8 unknown related page rejected", (await patch({ related: ["/thinking/not-a-page"] })).status, 422);
  eq("B9 mismatched year/date rejected", (await patch({ publicationYear: 2020, publicationDate: "2026-01-01" })).status, 422);
  eq("B10 missing revision rejected (400)", (await j(await api(admin, `/api/admin/publications/${A.id}`, { method: "PATCH", json: { title: "x" } }))).status, 400);
  const saved = await patch({
    subtitle: "A synthetic subtitle", author: "Jane Synthetic", introduction: "Synthetic introduction paragraph.\n\nSecond paragraph.", description: "Synthetic editorial description.",
    themes: ["Alpha theme", "Beta theme"], readership: "Synthetic readers.", availability: "forthcoming",
    editions: [{ format: "Paperback", isbn: "978-0-306-40615-7" }, { format: "eBook", isbn: "" }],
    retailers: [{ name: "Second Shop", url: "https://second.example.com/book" }, { name: "First Shop", url: "https://first.example.com/book" }],
    related: ["/thinking/architecting-intelligence", "/answers/what-is-business-architecture"], coverAlt: "",
  });
  eq("B11 a full, valid save succeeds", saved.status, 200); Object.assign(A, saved.body.publication);
  check("B12 retailer order and per-format ISBNs are kept", A.retailers[0].name === "Second Shop" && A.editions[0].isbn === "9780306406157" && A.editions[1].isbn === null, JSON.stringify([A.retailers, A.editions]));
  eq("B13 saving from a stale revision is refused (409, code stale)", (await j(await api(admin, `/api/admin/publications/${A.id}`, { method: "PATCH", json: { ...body({ subtitle: "stale" }), expectedRevision: A.revision - 1 } }))).body.code, "stale");

  // ---------- C. a draft leaks nowhere ----------
  const where = async (path) => (await fetch(BASE + path)).text();
  const home = await where("/"), cat = await where("/publications");
  eq("C1 draft page is 404", (await fetch(`${BASE}/publications/${A.slug}`)).status, 404);
  const draftPage = await where(`/publications/${A.slug}`);
  check("C2 the 404 contains no draft text", !draftPage.includes("Jane Synthetic") && !draftPage.includes("Synthetic introduction"));
  eq("C3 draft OG image is 404", (await fetch(`${BASE}/publications/${A.slug}/og`)).status, 404);
  check("C4 draft is absent from the homepage and the catalogue", !home.includes(A.title) && !cat.includes(A.title) && !cat.includes(A.slug));
  eq("C5 an unauthenticated draft preview is not reachable", (await fetch(`${BASE}/admin/publications/${A.id}/preview`, { redirect: "manual" })).status, 307);
  const prev = await api(admin, `/admin/publications/${A.id}/preview`); const prevHtml = await prev.text();
  check("C6 the admin preview shows the saved draft, says it is saved content, and is noindex", prev.status === 200 && prevHtml.includes("Preview of saved content") && prevHtml.includes("Jane Synthetic") && /noindex/.test(prevHtml), `${prev.status}`);
  eq("C7 featuring a draft is refused", (await j(await api(admin, `/api/admin/publications/${A.id}/feature`, { method: "POST", json: { featured: true } }))).body.code, "not_published");

  // ---------- D. cover upload hardening ----------
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  for (const [label, buf, type, name] of [["SVG labelled as PNG", svg, "image/png", "c.png"], ["SVG", svg, "image/svg+xml", "c.svg"], ["text labelled as JPEG", Buffer.from("hello"), "image/jpeg", "c.jpg"], ["truncated PNG", (await png()).subarray(0, 400), "image/png", "c.png"], ["tiny image", await png(100, 100), "image/png", "c.png"]]) {
    const r = await j(await upload(admin, A.id, A.revision, buf, type, name)); check(`D1 cover rejected: ${label}`, r.status === 422, JSON.stringify(r));
  }
  const big = await sharp({ create: { width: 3000, height: 3000, channels: 3, background: "#000" } }).raw().toBuffer(); // incompressible-ish payload size check uses request bytes
  eq("D2 an oversized request is refused (413) without being buffered", (await upload(admin, A.id, A.revision, Buffer.concat([big, big]), "image/png", "huge.png")).status, 413);
  eq("D3 a stale revision on upload is refused", (await upload(admin, A.id, A.revision - 1, await png())).status, 409);
  eq("D4 rejected uploads left nothing in storage", (await listObjects("publication-assets", A.id)).length, 0);
  const up1 = await j(await upload(admin, A.id, A.revision, await png(900, 1350, "#6b1f1f"))); eq("D5 a valid cover uploads", up1.status, 200); Object.assign(A, up1.body.publication);
  check("D6 the original is private; nothing public exists for a draft", (await listObjects("publication-assets", A.id)).length === 1 && (await listObjects("resource-covers", A.id)).length === 0);
  check("D7 the signed preview URL works and is not a public URL", up1.body.previewUrl?.includes("/object/sign/publication-assets/") && (await fetch(up1.body.previewUrl)).status === 200);
  check("D8 the private bucket has no public URL", (await fetch(`${SB}/storage/v1/object/public/publication-assets/publications/${A.id}/x/source.png`)).status >= 400);
  const up2 = await j(await upload(admin, A.id, A.revision, await png(900, 1350, "#1a1816"))); eq("D9 replacing the cover succeeds", up2.status, 200); Object.assign(A, up2.body.publication);
  eq("D10 only the new original remains (old one removed after the save)", (await listObjects("publication-assets", A.id)).length, 1);

  // ---------- E. publish, public pages, SEO ----------
  const incomplete = await j(await api(admin, "/api/admin/publications", { method: "POST", json: { title: `ZZ E2E Incomplete ${run}` } })); created.push(incomplete.body.publication.id);
  const inc = await j(await api(admin, `/api/admin/publications/${incomplete.body.publication.id}/status`, { method: "POST", json: { action: "publish", expectedRevision: 1 } }));
  check("E1 an incomplete title cannot be published (422 with the missing fields)", inc.status === 422 && !!inc.body.fieldErrors?.author && !!inc.body.fieldErrors?.introduction && !!inc.body.fieldErrors?.description, JSON.stringify(inc));
  eq("E2 publishing from a stale revision is refused", (await j(await api(admin, `/api/admin/publications/${A.id}/status`, { method: "POST", json: { action: "publish", expectedRevision: 1 } }))).body.code, "stale");
  const pub = await j(await api(admin, `/api/admin/publications/${A.id}/status`, { method: "POST", json: { action: "publish", expectedRevision: A.revision } })); eq("E3 publish", pub.status, 200); Object.assign(A, pub.body.publication);
  check("E4 public derivatives now exist (2 files)", (await listObjects("resource-covers", A.id)).length === 2);
  const page = await fetch(`${BASE}/publications/${A.slug}`); const html = await page.text();
  check("E5 the published page renders the real content", page.status === 200 && html.includes(A.title) && html.includes("Jane Synthetic") && html.includes("Second paragraph.") && html.includes("Alpha theme"));
  check("E6 retailer links are in the admin's order, https, new tab, noopener", html.indexOf("Second Shop") < html.indexOf("First Shop") && html.includes('href="https://second.example.com/book"') && /rel="noopener noreferrer"/.test(html));
  check("E7 per-format ISBNs are shown and the cover is uncropped with declared dimensions", html.includes("9780306406157") && html.includes("Paperback") && /<img[^>]+width="900"[^>]+height="1350"/.test(html), "");
  check("E8 related reading shows real titles and links", html.includes("Architecting Intelligence") && html.includes('href="/thinking/architecting-intelligence"') && html.includes("What Is Business Architecture?"));
  check("E9 canonical points at this publication", html.includes(`rel="canonical" href="https://modernbusinessarchitect.com/publications/${A.slug}"`) || html.includes(`href="https://modernbusinessarchitect.com/publications/${A.slug}"`), "");
  check("E10 non-production keeps noindex (header and meta)", page.headers.get("x-robots-tag") === "noindex, nofollow" && /noindex/.test(html));
  check("E11 og:image is publication-specific", html.includes(`/publications/${A.slug}/og`) && /og:type" content="book"/.test(html));
  const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
  const book = ld.find((x) => x["@type"] === "Book");
  check("E12 Book JSON-LD is accurate and invents nothing", !!book && book.name === A.title && book.author.name === "Jane Synthetic" && !("publisher" in book) && !("datePublished" in book) && !JSON.stringify(book).match(/offers|aggregateRating|review/) && book.workExample[0].isbn === "9780306406157", JSON.stringify(book));
  check("E13 existing site entities are still emitted (#website, #martin, #business)", ld.some((x) => x["@graph"]?.some((n) => n["@id"]?.endsWith("/#martin"))) && ld.some((x) => x["@type"] === "WebPage"), "");
  const og = await fetch(`${BASE}/publications/${A.slug}/og`); const ogBytes = Buffer.from(await og.arrayBuffer());
  const ogMeta = await sharp(ogBytes).metadata();
  check("E14 the OG image is a 1200x630 PNG", og.status === 200 && ogMeta.format === "png" && ogMeta.width === 1200 && ogMeta.height === 630, `${og.status} ${ogMeta.format} ${ogMeta.width}x${ogMeta.height}`);
  const cat2 = await where("/publications");
  check("E15 the catalogue lists it (single-title presentation) with a cover and link", cat2.includes(A.title) && cat2.includes(`href="/publications/${A.slug}"`));
  const featRes = await j(await api(admin, `/api/admin/publications/${A.id}/feature`, { method: "POST", json: { featured: true } }));
  eq("E16 featuring a published title works", featRes.status, 200); Object.assign(A, featRes.body.publication);
  const home2 = await where("/");
  check("E17 the homepage now shows the feature after the hero and before the legal strip", home2.includes(A.title) && home2.indexOf("Let&#x27;s find out") < home2.indexOf(A.title) && home2.indexOf(A.title) < home2.lastIndexOf('href="/privacy"'), "");
  const full = (extra, rev) => ({ title: A.title, slug: A.slug, subtitle: A.subtitle, author: A.author, introduction: A.introduction, description: A.description, themes: A.themes, readership: A.readership,
    availability: A.availability, editions: A.editions, retailers: A.retailers, related: A.related, coverAlt: A.coverAlt, ...extra, expectedRevision: rev });
  const liveEdit = async (extra, rev) => j(await api(admin, `/api/admin/publications/${A.id}`, { method: "PATCH", json: full(extra, rev) }));
  const le = await liveEdit({ subtitle: "Edited while live" }, A.revision); eq("E18 a live edit saves", le.status, 200); Object.assign(A, le.body.publication);
  check("E19 ...and the public page reflects it immediately", (await where(`/publications/${A.slug}`)).includes("Edited while live"));
  const empty = await liveEdit({ description: "" }, A.revision); check("E20 a live edit that empties required text is refused (422, field named)", empty.status === 422 && !!empty.body.fieldErrors?.description, JSON.stringify(empty));
  const noLinks = await liveEdit({ availability: "available", retailers: [] }, A.revision); check("E21 marking a live title Available without any link is refused", noLinks.status === 422 && !!noLinks.body.fieldErrors?.retailers, JSON.stringify(noLinks));

  // ---------- F. ordering + feature switching over HTTP ----------
  const mkp = async (n) => { const r = await j(await api(admin, "/api/admin/publications", { method: "POST", json: { title: `ZZ E2E ${n} ${run}` } })); created.push(r.body.publication.id); return r.body.publication; };
  const B = await mkp("Bravo"), C = await mkp("Charlie");
  for (const p of [B, C]) {
    const s = await j(await api(admin, `/api/admin/publications/${p.id}`, { method: "PATCH", json: { title: p.title, slug: p.slug, author: "Jane Synthetic", introduction: "Intro", description: "Desc", expectedRevision: p.revision } }));
    Object.assign(p, s.body.publication);
    Object.assign(p, (await j(await api(admin, `/api/admin/publications/${p.id}/status`, { method: "POST", json: { action: "publish", expectedRevision: p.revision } }))).body.publication);
  }
  const order = async () => (await service.from("publications").select("id").order("sort_order").order("created_at").order("id")).data.map((r) => r.id);
  const ids = await order();
  const mine = [A.id, B.id, C.id]; const others = ids.filter((i) => !mine.includes(i));
  eq("F1 creation order is catalogue order", ids.filter((i) => mine.includes(i)), mine);
  const desired = [...others, C.id, A.id, B.id];
  eq("F2 reorder succeeds", (await api(admin, "/api/admin/publications/reorder", { method: "POST", json: { expected: ids, order: desired } })).status, 200);
  eq("F3 stored order matches", await order(), desired);
  eq("F4 a stale reorder is refused (409 stale_list)", (await j(await api(admin, "/api/admin/publications/reorder", { method: "POST", json: { expected: ids, order: ids } }))).body.code, "stale_list");
  const cat3 = await where("/publications");
  check("F5 the public catalogue follows the new order", cat3.indexOf(C.title) < cat3.indexOf(A.title) && cat3.indexOf(A.title) < cat3.indexOf(B.title), "");
  check("F6 with several titles the catalogue uses editorial rows (no single-title block)", (cat3.match(/About the publication/g) ?? []).length >= 3);
  await api(admin, `/api/admin/publications/${B.id}/feature`, { method: "POST", json: { featured: true } });
  const feat = (await service.from("publications").select("id").eq("featured", true)).data;
  eq("F7 featuring another title switches the feature (exactly one featured)", feat.map((r) => r.id), [B.id]);
  const home3 = await where("/"); check("F8 the homepage shows the new featured title and not the old one", home3.includes(B.title) && !home3.includes(A.title), "");

  // ---------- G. unpublish ----------
  A.revision = (await service.from("publications").select("revision").eq("id", A.id).single()).data.revision;
  const un = await j(await api(admin, `/api/admin/publications/${A.id}/status`, { method: "POST", json: { action: "unpublish", expectedRevision: A.revision } })); eq("G1 unpublish", un.status, 200);
  eq("G2 the page is 404 again", (await fetch(`${BASE}/publications/${A.slug}`)).status, 404);
  eq("G3 the OG image is 404 again", (await fetch(`${BASE}/publications/${A.slug}/og`)).status, 404);
  check("G4 gone from the catalogue and homepage", !(await where("/publications")).includes(A.title) && !(await where("/")).includes(A.title));
  eq("G5 its public cover files were withdrawn", (await listObjects("resource-covers", A.id)).length, 0);
  eq("G6 the private original is kept for re-publishing", (await listObjects("publication-assets", A.id)).length, 1);
  const gone = await service.from("publications").select("featured,published").eq("id", A.id).single(); eq("G7 unpublished and not featured", gone.data, { featured: false, published: false });

  // ---------- H. existing features unaffected ----------
  for (const path of ["/resources", "/thinking", "/answers", "/work", "/martin", "/lets-talk", "/privacy"]) eq(`H1 ${path} still renders`, (await fetch(BASE + path)).status, 200);
  check("H2 Publications is in the navigation and both footers", (await where("/thinking")).includes('href="/publications"') && (await where("/thinking")).match(/href="\/publications"/g).length >= 3);
} catch (error) {
  results.push(`FAIL  unexpected error: ${error?.stack ?? error}`);
} finally {
  // cleanup: fixtures + the second user; restore the featured title that existed before
  for (const id of created) {
    await service.from("publications").update({ published: false, featured: false, cover_path: null, cover_thumb_path: null }).eq("id", id);
    await service.from("publications").delete().eq("id", id);
    for (const bucket of ["publication-assets", "resource-covers"]) {
      const s = service.storage.from(bucket); const { data: vs } = await s.list(`publications/${id}`); const paths = [];
      for (const v of vs ?? []) { const { data: fs } = await s.list(`publications/${id}/${v.name}`); for (const f of fs ?? []) paths.push(`publications/${id}/${v.name}/${f.name}`); }
      if (paths.length) await s.remove(paths);
    }
  }
  const users = await service.auth.admin.listUsers(); const u = users.data.users.find((x) => x.email === nonAdminEmail); if (u) await service.auth.admin.deleteUser(u.id);
  if (priorFeatured) await service.rpc("set_featured_publication", { p_id: priorFeatured, p_featured: true });
  console.log(results.join("\n"));
  const failed = results.filter((r) => r.startsWith("FAIL")).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}
