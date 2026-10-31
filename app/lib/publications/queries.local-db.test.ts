/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Publications against a REAL local Supabase (constraints, RPCs, triggers, RLS, storage).
 *
 *   set -a; source .env.development.local; set +a
 *   LOCAL_DB_IT=1 npx vitest run app/lib/publications/queries.local-db.test.ts
 *
 * Skipped unless LOCAL_DB_IT=1, and refuses to run against anything but localhost. Every fixture is synthetic
 * ("ZZ Test ..."), is removed afterwards, and the featured title that existed before the run is restored.
 */
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const enabled = process.env.LOCAL_DB_IT === "1";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const local = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url);

describe.skipIf(!enabled)("publications (real local database)", () => {
  let q: typeof import("./queries");
  let storage: typeof import("./storage");
  let admin: any;
  const created: string[] = [];
  let priorFeatured: string | null = null;
  const run = Date.now().toString(36);

  const png = (w = 800, h = 1200, bg = "#6b1f1f") => sharp({ create: { width: w, height: h, channels: 3, background: bg } }).png().toBuffer();
  const jpg = (w = 900, h = 1300) =>
    sharp({ create: { width: w, height: h, channels: 3, background: "#1a1816" } }).withExif({ IFD0: { Copyright: "SECRET" } }).jpeg().toBuffer();

  const mk = async (name: string, extra: Record<string, unknown> = {}) => {
    const p = await q.createPublication(`ZZ Test ${name} ${run}`, `zz-test-${name.toLowerCase().replace(/\W+/g, "-")}-${run}`);
    created.push(p.id);
    if (Object.keys(extra).length) {
      const { error } = await admin.from("publications").update(extra).eq("id", p.id);
      if (error) throw error;
    }
    return (await q.getPublicationAdmin(p.id))!;
  };
  const complete = { author: "Jane Test", introduction: "Intro text.", description: "Description text." };
  const row = async (id: string) => (await admin.from("publications").select("*").eq("id", id).single()).data as any;
  const listObjects = async (bucket: string, id: string) => {
    const s = admin.storage.from(bucket);
    const { data: versions } = await s.list(`publications/${id}`);
    const out: string[] = [];
    for (const v of versions ?? []) {
      const { data: files } = await s.list(`publications/${id}/${v.name}`);
      for (const f of files ?? []) out.push(`publications/${id}/${v.name}/${f.name}`);
    }
    return out;
  };
  const err = async (p: Promise<unknown>) => p.then(() => null, (e) => e as { status?: number; code?: string; message: string });

  beforeAll(async () => {
    if (!local) throw new Error("Refusing to run: NEXT_PUBLIC_SUPABASE_URL is not localhost.");
    admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    q = await import("./queries");
    storage = await import("./storage");
    priorFeatured = (await admin.from("publications").select("id").eq("featured", true).maybeSingle()).data?.id ?? null;
  });

  afterAll(async () => {
    if (!enabled) return;
    await admin.rpc("set_featured_publication", { p_id: created[0] ?? "", p_featured: false }).then(() => null, () => null);
    for (const id of created) {
      await admin.from("publications").update({ published: false, featured: false, cover_path: null, cover_thumb_path: null }).eq("id", id);
      await admin.from("publications").delete().eq("id", id);
      for (const bucket of [storage.PRIVATE_BUCKET, storage.PUBLIC_BUCKET]) await storage.removeObjects(bucket, await listObjects(bucket, id));
    }
    await admin.from("publications").delete().like("slug", `zz-test-%-${run}`);
    if (priorFeatured) await admin.rpc("set_featured_publication", { p_id: priorFeatured, p_featured: true });
  });

  describe("access control", () => {
    it("anon and authenticated roles cannot read, write or call anything", async () => {
      const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
      const draft = await mk("rls", complete);
      expect((await anon.from("publications").select("id")).error).toBeTruthy();
      expect((await anon.from("publications").insert({ title: "x", slug: "zz-x" })).error).toBeTruthy();
      expect((await anon.from("publications").update({ title: "hacked" }).eq("id", draft.id)).error).toBeTruthy();
      expect((await anon.rpc("set_featured_publication", { p_id: draft.id, p_featured: true })).error).toBeTruthy();
      expect((await anon.rpc("reorder_publications", { p_expected: [], p_desired: [] })).error).toBeTruthy();

      const email = `zz-nonadmin-${run}@example.test`;
      await admin.auth.admin.createUser({ email, password: "Local-Nonadmin-Pw-1", email_confirm: true });
      const signedIn = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
      await signedIn.auth.signInWithPassword({ email, password: "Local-Nonadmin-Pw-1" });
      expect((await signedIn.from("publications").select("id")).error).toBeTruthy();
      expect((await signedIn.rpc("set_featured_publication", { p_id: draft.id, p_featured: true })).error).toBeTruthy();
      const users = await admin.auth.admin.listUsers();
      const u = users.data.users.find((x: { email?: string }) => x.email === email);
      if (u) await admin.auth.admin.deleteUser(u.id);
      expect(await row(draft.id)).toMatchObject({ title: draft.title, featured: false });
    });
    it("the private bucket is not readable or listable by anon", async () => {
      const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
      const { data } = await anon.storage.from(storage.PRIVATE_BUCKET).list("publications");
      expect(data ?? []).toEqual([]);
      const res = await fetch(`${url}/storage/v1/object/public/${storage.PRIVATE_BUCKET}/publications/x/y/source.png`);
      expect(res.ok).toBe(false);
    });
  });

  describe("integrity constraints", () => {
    it("slugs are unique case-insensitively and well-formed", async () => {
      const a = await mk("slug a");
      expect((await err(q.createPublication("Dup", a.slug)))).toMatchObject({ code: "slug_taken", status: 409 });
      expect((await admin.from("publications").insert({ title: "x", slug: a.slug.toUpperCase() })).error).toBeTruthy();
      expect((await admin.from("publications").insert({ title: "x", slug: "Bad Slug!" })).error).toBeTruthy();
    });
    it("a featured title must be published; a published one must be complete; arrays are bounded and https/local only", async () => {
      const p = await mk("constraints");
      expect((await admin.from("publications").update({ featured: true }).eq("id", p.id)).error).toBeTruthy();
      expect((await admin.from("publications").update({ published: true }).eq("id", p.id)).error).toBeTruthy();
      expect((await admin.from("publications").update({ retailers: [{ name: "x", url: "http://insecure.com" }] }).eq("id", p.id)).error).toBeTruthy();
      expect((await admin.from("publications").update({ retailers: [{ name: "x", url: "javascript:alert(1)" }] }).eq("id", p.id)).error).toBeTruthy();
      expect((await admin.from("publications").update({ related: ["https://evil.com"] }).eq("id", p.id)).error).toBeTruthy();
      expect((await admin.from("publications").update({ related: ["//evil.com"] }).eq("id", p.id)).error).toBeTruthy();
      expect((await admin.from("publications").update({ retailers: Array.from({ length: 21 }, () => ({ name: "x", url: "https://a.com/x" })) }).eq("id", p.id)).error).toBeTruthy();
      expect((await admin.from("publications").update({ retailers: "nope" }).eq("id", p.id)).error).toBeTruthy();
      expect((await admin.from("publications").update({ cover_path: "publications/x/y/cover-1200.webp", cover_thumb_path: "t", cover_source_path: "s", cover_width: 1, cover_height: 1 }).eq("id", p.id)).error).toBeTruthy(); // public cover on a draft
      expect((await admin.from("publications").update({ availability: "sold" }).eq("id", p.id)).error).toBeTruthy();
    });
  });

  describe("ordering, revisions, featuring", () => {
    it("new titles go last; reorder is atomic, stale-checked and does not touch revisions", async () => {
      const [a, b, c] = [await mk("ord a"), await mk("ord b"), await mk("ord c")];
      const all = await q.listPublicationsAdmin();
      const ids = all.map((p) => p.id);
      expect(ids.indexOf(a.id)).toBeLessThan(ids.indexOf(b.id));
      expect(ids.indexOf(b.id)).toBeLessThan(ids.indexOf(c.id));

      const desired = ids.filter((id) => ![a.id, b.id, c.id].includes(id));
      desired.push(c.id, a.id, b.id);
      await q.reorderPublications(ids, desired);
      const after = await q.listPublicationsAdmin();
      expect(after.map((p) => p.id)).toEqual(desired);
      expect((await q.getPublicationAdmin(a.id))!.revision).toBe(a.revision); // pure reorder: no new revision

      expect(await err(q.reorderPublications(ids, desired))).toMatchObject({ code: "stale_list", status: 409 }); // stale view
      expect(await err(q.reorderPublications(desired, desired.slice(1)))).toMatchObject({ code: "invalid" }); // missing one
      expect(await err(q.reorderPublications(desired, [...desired.slice(1), desired[1]]))).toMatchObject({ code: "invalid" }); // duplicate
      expect((await q.listPublicationsAdmin()).map((p) => p.id)).toEqual(desired); // nothing changed
    });
    it("optimistic revisions: the second of two edits from the same revision is refused", async () => {
      const p = await mk("rev");
      const input = { title: p.title, slug: p.slug, subtitle: "", author: "", introduction: "", description: "", readership: "", themes: [], availability: "forthcoming" as const, publicationYear: null, publicationDate: null, publisher: "", language: "", editions: [], retailers: [], related: [], coverAlt: "" };
      const first = await q.updatePublicationContent(p.id, p.revision, { ...input, subtitle: "one" });
      expect(first.revision).toBe(p.revision + 1);
      expect(await err(q.updatePublicationContent(p.id, p.revision, { ...input, subtitle: "two" }))).toMatchObject({ code: "stale", status: 409 });
      expect((await q.getPublicationAdmin(p.id))!.subtitle).toBe("one");
    });
    it("feature switching: exactly one featured title, even under concurrent switches; only published titles qualify", async () => {
      const [a, b] = [await mk("feat a", { ...complete }), await mk("feat b", { ...complete })];
      const draft = await mk("feat draft", complete);
      await q.publishPublication(a.id, a.revision);
      await q.publishPublication(b.id, b.revision);
      expect(await err(q.setFeaturedPublication(draft.id, true))).toMatchObject({ code: "not_published", status: 409 });

      await Promise.all([a.id, b.id, a.id, b.id, a.id, b.id].map((id) => q.setFeaturedPublication(id, true).then(() => null, (e) => e)));
      const { data } = await admin.from("publications").select("id").eq("featured", true);
      expect(data).toHaveLength(1);
      expect([a.id, b.id]).toContain(data![0].id);
      expect((await q.getFeaturedPublication())?.slug).toBeTruthy();

      await q.setFeaturedPublication(a.id, true);
      expect((await row(a.id)).featured).toBe(true);
      expect((await row(b.id)).featured).toBe(false);
      await q.unpublishPublication(a.id, (await q.getPublicationAdmin(a.id))!.revision);
      expect((await row(a.id))).toMatchObject({ published: false, featured: false }); // unpublishing clears the feature
      expect((await admin.from("publications").select("id").eq("featured", true)).data).toEqual([]);
      expect(await q.getFeaturedPublication()).toBeNull();
    });
  });

  describe("publish / unpublish and what the public can see", () => {
    it("a draft is invisible to every public read; publishing exposes only the public projection; unpublishing hides it again", async () => {
      const p = await mk("vis", complete);
      expect((await q.listPublishedPublications()).some((x) => x.slug === p.slug)).toBe(false);
      expect(await q.getPublishedPublicationBySlug(p.slug)).toBeNull();
      expect((await q.listPublishedForSitemap()).some((x) => x.slug === p.slug)).toBe(false);
      expect(await q.getPublishedCoverPathBySlug(p.slug)).toBeNull();

      const published = await q.publishPublication(p.id, p.revision);
      expect(published.published).toBe(true);
      const pub = await q.getPublishedPublicationBySlug(p.slug);
      expect(pub).toBeTruthy();
      expect(Object.keys(pub!).sort()).toEqual(["author", "availability", "cover", "description", "editions", "featured", "introduction", "language", "publicationDate", "publicationYear", "publisher", "readership", "related", "retailers", "slug", "subtitle", "themes", "title", "updatedAt"]);
      expect(JSON.stringify(pub)).not.toMatch(/revision|source|sort_order|"id"/);
      expect((await q.listPublishedForSitemap()).some((x) => x.slug === p.slug)).toBe(true);

      await q.unpublishPublication(p.id, published.revision);
      expect(await q.getPublishedPublicationBySlug(p.slug)).toBeNull();
      expect((await q.listPublishedForSitemap()).some((x) => x.slug === p.slug)).toBe(false);
    });
    it("refuses to publish incomplete text, and refuses a live edit that would empty it", async () => {
      const p = await mk("incomplete", { author: "A" });
      expect(await err(q.publishPublication(p.id, p.revision))).toMatchObject({ code: "invalid", status: 422, fieldErrors: expect.objectContaining({ introduction: expect.any(String), description: expect.any(String) }) });
      const ok = await mk("live", complete);
      const live = await q.publishPublication(ok.id, ok.revision);
      const input = { title: live.title, slug: live.slug, subtitle: "", author: "Jane", introduction: "", description: "d", readership: "", themes: [], availability: "forthcoming" as const, publicationYear: null, publicationDate: null, publisher: "", language: "", editions: [], retailers: [], related: [], coverAlt: "" };
      expect(await err(q.updatePublicationContent(live.id, live.revision, input))).toMatchObject({ code: "invalid", status: 422 });
      const availableNoLinks = { ...input, introduction: "i", availability: "available" as const };
      expect(await err(q.updatePublicationContent(live.id, live.revision, availableNoLinks))).toMatchObject({ code: "invalid", fieldErrors: { retailers: expect.any(String) } });
    });
  });

  describe("covers", () => {
    it("draft: original stored privately, nothing public; publish creates derivatives; unpublish removes them; republish recreates", async () => {
      const p = await mk("cover life", complete);
      const withCover = await q.replaceCover(p.id, p.revision, await png());
      expect(withCover.hasCover).toBe(true);
      expect(await listObjects(storage.PRIVATE_BUCKET, p.id)).toHaveLength(1);
      expect(await listObjects(storage.PUBLIC_BUCKET, p.id)).toEqual([]); // a draft cover is never public
      expect((await row(p.id)).cover_path).toBeNull();

      const live = await q.publishPublication(p.id, withCover.revision);
      const r1 = await row(p.id);
      expect(r1.cover_path).toMatch(/cover-1200\.webp$/);
      expect((await listObjects(storage.PUBLIC_BUCKET, p.id)).sort()).toEqual([r1.cover_thumb_path, r1.cover_path].sort());
      const publicCover = (await q.getPublishedPublicationBySlug(p.slug))!.cover!;
      expect((await fetch(publicCover.src)).headers.get("content-type")).toBe("image/webp");
      expect(publicCover).toMatchObject({ width: 800, height: 1200 });

      const down = await q.unpublishPublication(p.id, live.revision);
      expect(await listObjects(storage.PUBLIC_BUCKET, p.id)).toEqual([]);
      expect((await row(p.id))).toMatchObject({ cover_path: null, cover_thumb_path: null });
      expect(await listObjects(storage.PRIVATE_BUCKET, p.id)).toHaveLength(1); // original kept for re-publishing

      await q.publishPublication(p.id, down.revision);
      const r2 = await row(p.id);
      expect(r2.cover_path).toBeTruthy();
      expect(r2.cover_path).not.toBe(r1.cover_path); // fresh immutable path
    });
    it("replacement saves the new cover first and then removes the old one (private and public), stripping metadata", async () => {
      const p = await mk("cover replace", complete);
      const a = await q.replaceCover(p.id, p.revision, await png());
      const live = await q.publishPublication(p.id, a.revision);
      const before = await row(p.id);

      const b = await q.replaceCover(p.id, live.revision, await jpg());
      const after = await row(p.id);
      expect(after.cover_source_path).not.toBe(before.cover_source_path);
      expect(after.cover_path).not.toBe(before.cover_path);
      expect((await listObjects(storage.PRIVATE_BUCKET, p.id))).toEqual([after.cover_source_path]);
      expect((await listObjects(storage.PUBLIC_BUCKET, p.id)).sort()).toEqual([after.cover_thumb_path, after.cover_path].sort());
      expect(b.revision).toBeGreaterThan(live.revision);
      const stored = (await admin.storage.from(storage.PRIVATE_BUCKET).download(after.cover_source_path)).data!;
      expect(Buffer.from(await stored.arrayBuffer()).includes(Buffer.from("SECRET"))).toBe(false);
    });
    it("removal clears the row and every object", async () => {
      const p = await mk("cover remove", complete);
      const a = await q.replaceCover(p.id, p.revision, await png());
      const live = await q.publishPublication(p.id, a.revision);
      const gone = await q.removeCover(p.id, live.revision);
      expect(gone.hasCover).toBe(false);
      expect(await listObjects(storage.PRIVATE_BUCKET, p.id)).toEqual([]);
      expect(await listObjects(storage.PUBLIC_BUCKET, p.id)).toEqual([]);
      expect((await q.getPublishedPublicationBySlug(p.slug))!.cover).toBeNull(); // text-only layout
    });
    it("a database failure after the upload rolls the new asset back and keeps the old cover intact", async () => {
      const p = await mk("cover fail", complete);
      const a = await q.replaceCover(p.id, p.revision, await png());
      const live = await q.publishPublication(p.id, a.revision);
      const before = await row(p.id);
      const objectsBefore = [...(await listObjects(storage.PRIVATE_BUCKET, p.id)), ...(await listObjects(storage.PUBLIC_BUCKET, p.id))].sort();

      // Make the cover save fail inside Postgres, after the files have been written to storage. The local database
      // container is reached through docker so no extra driver is needed; if it cannot be, this test FAILS (it never skips).
      const psql = (sql: string) => execFileSync("docker", ["exec", "-i", "supabase_db_mba-site", "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-q", "-c", sql], { stdio: "pipe" });
      psql(`create or replace function zz_fail_cover() returns trigger language plpgsql as $$ begin if new.cover_source_path is distinct from old.cover_source_path and new.title like 'ZZ Test cover fail%' then raise exception 'injected failure'; end if; return new; end $$`);
      psql(`drop trigger if exists zz_fail_cover_trg on publications; create trigger zz_fail_cover_trg before update on publications for each row execute function zz_fail_cover()`);
      try {
        expect(await err(q.replaceCover(p.id, live.revision, await jpg()))).toMatchObject({ status: 500 });
      } finally {
        psql(`drop trigger if exists zz_fail_cover_trg on publications; drop function if exists zz_fail_cover()`);
      }
      expect(await row(p.id)).toMatchObject({ cover_source_path: before.cover_source_path, cover_path: before.cover_path, revision: before.revision });
      expect([...(await listObjects(storage.PRIVATE_BUCKET, p.id)), ...(await listObjects(storage.PUBLIC_BUCKET, p.id))].sort()).toEqual(objectsBefore);
    });
    it("a stale or concurrent upload leaves no orphan: of two racing replacements exactly one survives", async () => {
      const p = await mk("cover race", complete);
      const results = await Promise.all([
        q.replaceCover(p.id, p.revision, await png(700, 1000, "#112233")).then(() => "ok", (e) => e.code),
        q.replaceCover(p.id, p.revision, await png(700, 1000, "#334455")).then(() => "ok", (e) => e.code),
      ]);
      expect(results.sort()).toEqual(["ok", "stale"]);
      const after = await row(p.id);
      expect(await listObjects(storage.PRIVATE_BUCKET, p.id)).toEqual([after.cover_source_path]);
    });
    it("rejects bad uploads without changing the row or storing anything", async () => {
      const p = await mk("cover bad", complete);
      const bad = [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), Buffer.from("not an image"), (await png()).subarray(0, 300)];
      for (const buf of bad) expect(await err(q.replaceCover(p.id, p.revision, buf))).toMatchObject({ code: "cover_invalid", status: 422 });
      expect(await err(q.replaceCover(p.id, 999, await png()))).toMatchObject({ code: "stale" });
      expect(await listObjects(storage.PRIVATE_BUCKET, p.id)).toEqual([]);
      expect((await row(p.id)).revision).toBe(p.revision);
    });
    it("sweeps only old, unreferenced objects (an in-flight upload is never deleted)", async () => {
      const p = await mk("sweep", complete);
      const stray = `publications/${p.id}/${storage.newAssetVersion()}/source.png`;
      await admin.storage.from(storage.PRIVATE_BUCKET).upload(stray, await png(), { contentType: "image/png" });
      expect(await storage.sweepOrphans(p.id, [])).toBe(0); // brand new: left alone
      expect(await listObjects(storage.PRIVATE_BUCKET, p.id)).toEqual([stray]);
      await storage.removeObjects(storage.PRIVATE_BUCKET, [stray]);
    });
  });

  describe("deleting", () => {
    it("deletes drafts (and their assets) but never a published title", async () => {
      const p = await mk("delete", complete);
      const c = await q.replaceCover(p.id, p.revision, await png());
      const live = await q.publishPublication(p.id, c.revision);
      expect(await err(q.deletePublication(p.id, live.revision))).toMatchObject({ code: "conflict", status: 409 });
      const down = await q.unpublishPublication(p.id, live.revision);
      await q.deletePublication(p.id, down.revision);
      expect(await q.getPublicationAdmin(p.id)).toBeNull();
      expect(await listObjects(storage.PRIVATE_BUCKET, p.id)).toEqual([]);
      expect(await listObjects(storage.PUBLIC_BUCKET, p.id)).toEqual([]);
    });
  });

  describe("sitemap", () => {
    it("lists published titles only, in production, and nothing at all outside it", async () => {
      const draft = await mk("sm draft", complete);
      const live = await mk("sm live", complete);
      await q.publishPublication(live.id, live.revision);
      const off = await mk("sm off", complete);
      const offLive = await q.publishPublication(off.id, off.revision);
      await q.unpublishPublication(off.id, offLive.revision);

      vi.stubEnv("APP_ENV", "production");
      vi.stubEnv("VERCEL", "");
      vi.stubEnv("VERCEL_ENV", "");
      const { default: sitemap } = await import("@/app/sitemap-data");
      const urls = (await sitemap()).map((e) => e.url);
      expect(urls).toContain(`https://modernbusinessarchitect.com/publications/${live.slug}`);
      expect(urls).toContain("https://modernbusinessarchitect.com/publications");
      expect(urls).not.toContain(`https://modernbusinessarchitect.com/publications/${draft.slug}`);
      expect(urls).not.toContain(`https://modernbusinessarchitect.com/publications/${off.slug}`);
      vi.stubEnv("APP_ENV", "preview");
      expect(await sitemap()).toEqual([]);
      vi.unstubAllEnvs();
    });
  });
});
