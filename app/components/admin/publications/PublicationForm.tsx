"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RELATED_KIND_LABEL, type RelatedEntry } from "@/app/lib/publications/related-index";
import type { AdminPublication, PublicationEdition, PublicationRetailer } from "@/app/lib/publications/types";
import {
  LIMITS,
  publishBlockers,
  publishWarnings,
  readinessSubjectFromAdmin,
  slugify,
} from "@/app/lib/publications/validation";
import { adminFetch } from "./api";

const input = "w-full border border-[#1a1816]/15 bg-white px-4 py-3 focus:outline-none focus:border-[#6b1f1f]";
const small = "border border-[#1a1816]/15 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#6b1f1f]";
const iconBtn = "px-2 py-1 border border-[#1a1816]/15 text-sm hover:border-[#6b1f1f] disabled:opacity-30";
const sectionTitle = "text-xs font-semibold uppercase tracking-widest text-[#6b1f1f]";
const MAX_COVER_BYTES = 3_800_000;

type FormState = {
  title: string;
  slug: string;
  subtitle: string;
  author: string;
  introduction: string;
  description: string;
  readership: string;
  themesText: string;
  availability: "forthcoming" | "available";
  publicationYear: string;
  publicationDate: string;
  publisher: string;
  language: string;
  editions: PublicationEdition[];
  retailers: PublicationRetailer[];
  related: string[];
  coverAlt: string;
};

const toForm = (p: AdminPublication): FormState => ({
  title: p.title,
  slug: p.slug,
  subtitle: p.subtitle ?? "",
  author: p.author ?? "",
  introduction: p.introduction ?? "",
  description: p.description ?? "",
  readership: p.readership ?? "",
  themesText: p.themes.join("\n"),
  availability: p.availability,
  publicationYear: p.publicationYear ? String(p.publicationYear) : "",
  publicationDate: p.publicationDate ?? "",
  publisher: p.publisher ?? "",
  language: p.language ?? "",
  editions: p.editions,
  retailers: p.retailers,
  related: p.related,
  coverAlt: p.coverAlt ?? "",
});

const toPayload = (f: FormState) => ({
  ...f,
  themes: f.themesText.split("\n"),
  publicationYear: f.publicationYear.trim() ? Number(f.publicationYear) : null,
  publicationDate: f.publicationDate || null,
});

function move<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[#1a1816]/70 mb-2">
        {label} {hint && <span className="text-[#1a1816]/40">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-sm text-[#6b1f1f] mt-1" role="alert">{error}</p>}
    </div>
  );
}

export default function PublicationForm({
  initial,
  initialCoverPreviewUrl,
  relatedOptions,
}: {
  initial: AdminPublication;
  initialCoverPreviewUrl: string | null;
  relatedOptions: RelatedEntry[];
}) {
  const router = useRouter();
  const [pub, setPub] = React.useState(initial);
  const [form, setForm] = React.useState<FormState>(() => toForm(initial));
  const [coverUrl, setCoverUrl] = React.useState(initialCoverPreviewUrl);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [notice, setNotice] = React.useState<{ kind: "ok" | "error"; text: string; stale?: boolean } | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [slugTouched, setSlugTouched] = React.useState(true);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const dirty = JSON.stringify(toPayload(form)) !== JSON.stringify(toPayload(toForm(pub)));

  React.useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const fail = (result: { error: string; code?: string; fieldErrors?: Record<string, string> }) => {
    setErrors(result.fieldErrors ?? {});
    setNotice({ kind: "error", text: result.error, stale: result.code === "stale" });
  };

  const run = async (name: string, fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(name);
    setNotice(null);
    setErrors({});
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const save = () =>
    run("save", async () => {
      const result = await adminFetch(`/api/admin/publications/${pub.id}`, {
        method: "PATCH",
        json: { ...toPayload(form), expectedRevision: pub.revision },
      });
      if (!result.ok) return fail(result);
      setPub(result.publication!);
      setForm(toForm(result.publication!));
      setNotice({
        kind: "ok",
        text: result.publication!.published ? "Live edit saved. The public page already shows these changes." : "Draft saved.",
      });
    });

  const changeStatus = (action: "publish" | "unpublish") =>
    run(action, async () => {
      if (action === "unpublish" && !window.confirm("Unpublish this title? It disappears from the site, the catalogue and the sitemap, and is no longer featured. Copies already cached elsewhere may persist for a while.")) return;
      const result = await adminFetch(`/api/admin/publications/${pub.id}/status`, { method: "POST", json: { action, expectedRevision: pub.revision } });
      if (!result.ok) return fail(result);
      setPub(result.publication!);
      setNotice({ kind: "ok", text: action === "publish" ? "Published. It is now live." : "Unpublished. It is a draft again." });
    });

  const changeFeatured = (featured: boolean) =>
    run("feature", async () => {
      const result = await adminFetch(`/api/admin/publications/${pub.id}/feature`, { method: "POST", json: { featured } });
      if (!result.ok) return fail(result);
      setPub(result.publication!);
      setNotice({ kind: "ok", text: featured ? "Now featured on the homepage (any previously featured title was replaced)." : "No longer featured on the homepage." });
    });

  const uploadCover = (file: File) =>
    run("cover", async () => {
      if (file.size > MAX_COVER_BYTES) {
        setNotice({ kind: "error", text: "That file is over 3.8 MB. Export a smaller JPEG, PNG or WebP." });
        return;
      }
      const body = new FormData();
      body.set("file", file);
      body.set("expectedRevision", String(pub.revision));
      const result = await adminFetch(`/api/admin/publications/${pub.id}/cover`, { method: "POST", form: body });
      if (fileRef.current) fileRef.current.value = "";
      if (!result.ok) return fail(result);
      setPub(result.publication!);
      setCoverUrl(result.previewUrl ?? null);
      setNotice({ kind: "ok", text: pub.published ? "Cover replaced. It is live now." : "Cover uploaded." });
    });

  const removeCover = () =>
    run("cover", async () => {
      if (!window.confirm("Remove the cover? The page will use the text-only layout.")) return;
      const result = await adminFetch(`/api/admin/publications/${pub.id}/cover`, { method: "DELETE", json: { expectedRevision: pub.revision } });
      if (!result.ok) return fail(result);
      setPub(result.publication!);
      setCoverUrl(null);
      set("coverAlt", "");
      setNotice({ kind: "ok", text: "Cover removed." });
    });

  const deleteDraft = () =>
    run("delete", async () => {
      if (!window.confirm(`Delete the draft “${pub.title}”? This cannot be undone.`)) return;
      const result = await adminFetch(`/api/admin/publications/${pub.id}`, { method: "DELETE", json: { expectedRevision: pub.revision } });
      if (!result.ok) return fail(result);
      router.push("/admin/publications");
      router.refresh();
    });

  // Readiness is judged on the SAVED version, because that is what publishing uses.
  const subject = readinessSubjectFromAdmin(pub);
  const blockers = Object.values(publishBlockers(subject));
  const warnings = publishWarnings(subject);
  const relatedByPath = new Map(relatedOptions.map((o) => [o.path, o]));
  const availableRelated = relatedOptions.filter((o) => !form.related.includes(o.path));

  return (
    <div className="max-w-3xl">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-light [overflow-wrap:anywhere]">{pub.title}</h1>
          <p className="mt-2 text-sm">
            <span className={pub.published ? "font-semibold text-[#6b1f1f]" : "text-[#1a1816]/60"}>{pub.published ? "Published (live)" : "Draft"}</span>
            {pub.featured && <span className="ml-3 border border-[#6b1f1f] px-2 py-0.5 text-xs uppercase tracking-widest text-[#6b1f1f]">Featured on homepage</span>}
            <span className="ml-3 text-xs text-[#1a1816]/40">revision {pub.revision}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs uppercase tracking-widest">
          <Link href={`/admin/publications/${pub.id}/preview`} target="_blank" className="underline underline-offset-4 hover:text-[#6b1f1f]">Preview saved content</Link>
          {pub.published && <Link href={`/publications/${pub.slug}`} target="_blank" className="underline underline-offset-4 hover:text-[#6b1f1f]">View live</Link>}
          <Link href="/admin/publications" className="text-[#1a1816]/55 hover:text-[#1a1816]">All publications</Link>
        </div>
      </div>

      {pub.published && (
        <div className="mb-6 border border-[#6b1f1f] bg-[#6b1f1f]/5 p-4 text-sm text-[#6b1f1f]">
          <strong>This title is live.</strong> Saving publishes your changes to the public site immediately; there is no separate draft of a published
          title. The title, author, introduction and description can&apos;t be emptied while it is live.
        </div>
      )}

      {notice && (
        <div role={notice.kind === "error" ? "alert" : "status"} className={`mb-6 border p-4 text-sm ${notice.kind === "error" ? "border-[#6b1f1f]/40 bg-white text-[#6b1f1f]" : "border-[#1a1816]/20 bg-white text-[#1a1816]"}`}>
          {notice.text}{" "}
          {notice.stale && (
            <button type="button" className="font-semibold underline underline-offset-2" onClick={() => window.location.reload()}>
              Reload the latest version
            </button>
          )}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-12">
        {/* IDENTITY */}
        <section className="space-y-6" aria-labelledby="s-identity">
          <h2 id="s-identity" className={sectionTitle}>Title and author</h2>
          <Field id="f-title" label="Title" error={errors.title}>
            <input id="f-title" className={input} value={form.title} maxLength={LIMITS.title} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
          </Field>
          <Field id="f-slug" label="URL slug" error={errors.slug} hint={pub.published ? "(changing this changes the live address; the old one will 404)" : undefined}>
            <input id="f-slug" className={`${input} font-mono text-sm`} value={form.slug} maxLength={LIMITS.slugMax} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
            <p className="text-xs text-[#1a1816]/45 mt-1">/publications/{form.slug || "…"}</p>
          </Field>
          <Field id="f-subtitle" label="Subtitle" hint="(optional)" error={errors.subtitle}>
            <input id="f-subtitle" className={input} value={form.subtitle} maxLength={LIMITS.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <Field id="f-author" label="Author" hint="(required to publish)" error={errors.author}>
            <input id="f-author" className={input} value={form.author} maxLength={LIMITS.author} onChange={(e) => set("author", e.target.value)} />
          </Field>
        </section>

        {/* TEXT */}
        <section className="space-y-6" aria-labelledby="s-text">
          <h2 id="s-text" className={sectionTitle}>Text</h2>
          <Field id="f-intro" label="Introduction" hint={`(required to publish; the short opening readers see first, up to ${LIMITS.introduction.toLocaleString("en-US")} characters)`} error={errors.introduction}>
            <textarea id="f-intro" className={input} rows={5} value={form.introduction} maxLength={LIMITS.introduction} onChange={(e) => set("introduction", e.target.value)} />
          </Field>
          <Field id="f-desc" label="Editorial description" hint="(required to publish; separate paragraphs with a blank line)" error={errors.description}>
            <textarea id="f-desc" className={input} rows={12} value={form.description} maxLength={LIMITS.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field id="f-themes" label="Themes" hint="(optional; one per line)" error={errors.themes}>
            <textarea id="f-themes" className={input} rows={4} value={form.themesText} onChange={(e) => set("themesText", e.target.value)} />
          </Field>
          <Field id="f-readership" label="Who it is for" hint="(optional)" error={errors.readership}>
            <textarea id="f-readership" className={input} rows={3} value={form.readership} maxLength={LIMITS.readership} onChange={(e) => set("readership", e.target.value)} />
          </Field>
        </section>

        {/* COVER */}
        <section className="space-y-4" aria-labelledby="s-cover">
          <h2 id="s-cover" className={sectionTitle}>Cover</h2>
          <p className="text-sm text-[#1a1816]/60">
            JPEG, PNG or WebP, up to 3.8 MB, at least {300}px on the short side. It is shown whole, never cropped. The original is kept private; optimised
            copies are made public only while the title is published. A cover is optional: without one the page uses a text-only layout.
          </p>
          <div className="flex flex-wrap items-start gap-6">
            {pub.hasCover && coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL of the private original
              <img src={coverUrl} alt={form.coverAlt || "Current cover"} className="h-48 w-auto border border-[#1a1816]/15 bg-white" />
            ) : (
              <div className="flex h-48 w-32 items-center justify-center border border-dashed border-[#1a1816]/25 p-3 text-center text-xs text-[#1a1816]/50">
                {pub.hasCover ? "Preview expired. Reload." : "No cover"}
              </div>
            )}
            <div className="space-y-3">
              <label htmlFor="f-cover" className="block text-sm text-[#1a1816]/70">{pub.hasCover ? "Replace cover" : "Upload cover"}</label>
              <input
                id="f-cover"
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy !== null}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }}
                className="block text-sm"
              />
              {busy === "cover" && <p className="text-xs text-[#1a1816]/60">Uploading and checking the image…</p>}
              {pub.hasCover && (
                <button type="button" onClick={removeCover} disabled={busy !== null} className="text-xs uppercase tracking-widest underline underline-offset-4 text-[#6b1f1f] disabled:opacity-40">
                  Remove cover
                </button>
              )}
            </div>
          </div>
          <Field id="f-alt" label="Cover description for screen readers" hint="(recommended)" error={errors.coverAlt}>
            <input id="f-alt" className={input} value={form.coverAlt} maxLength={LIMITS.coverAlt} onChange={(e) => set("coverAlt", e.target.value)} disabled={!pub.hasCover} />
          </Field>
        </section>

        {/* PUBLICATION DATA */}
        <section className="space-y-6" aria-labelledby="s-data">
          <h2 id="s-data" className={sectionTitle}>Publication details</h2>
          <fieldset>
            <legend className="block text-sm text-[#1a1816]/70 mb-2">Availability</legend>
            <div className="flex flex-wrap gap-8">
              {(["forthcoming", "available"] as const).map((value) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer capitalize">
                  <input type="radio" name="availability" checked={form.availability === value} onChange={() => set("availability", value)} className="h-4 w-4 accent-[#6b1f1f]" />
                  {value}
                </label>
              ))}
            </div>
            <p className="text-xs text-[#1a1816]/50 mt-2">
              Independent of draft or published. A forthcoming title needs no retailer, ISBN or date. An available title needs at least one link.
            </p>
            {errors.availability && <p className="text-sm text-[#6b1f1f] mt-1" role="alert">{errors.availability}</p>}
          </fieldset>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field id="f-date" label="Exact publication date" hint="(optional)" error={errors.publicationDate}>
              <input id="f-date" type="date" className={input} value={form.publicationDate} onChange={(e) => set("publicationDate", e.target.value)} />
            </Field>
            <Field id="f-year" label="Publication year" hint="(optional)" error={errors.publicationYear}>
              <input id="f-year" inputMode="numeric" className={input} value={form.publicationYear} maxLength={4} onChange={(e) => set("publicationYear", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field id="f-publisher" label="Publisher" hint="(optional; leave blank if unknown or self-published)" error={errors.publisher}>
              <input id="f-publisher" className={input} value={form.publisher} maxLength={LIMITS.publisher} onChange={(e) => set("publisher", e.target.value)} />
            </Field>
            <Field id="f-language" label="Language" hint="(optional; e.g. en, fr)" error={errors.language}>
              <input id="f-language" list="language-codes" className={input} value={form.language} maxLength={35} onChange={(e) => set("language", e.target.value.trim())} />
              <datalist id="language-codes">
                {["en", "fr", "fr-CA", "es", "de", "pt", "it", "nl"].map((l) => <option key={l} value={l} />)}
              </datalist>
            </Field>
          </div>

          {/* Editions */}
          <div>
            <h3 className="text-sm text-[#1a1816]/70 mb-1">Formats and ISBNs</h3>
            <p className="text-xs text-[#1a1816]/50 mb-3">Each format has its own ISBN. Leave the ISBN blank if there isn&apos;t one yet. Hyphens are fine.</p>
            <ul className="space-y-3">
              {form.editions.map((edition, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <input aria-label={`Format ${i + 1}`} list="edition-formats" className={`${small} w-44`} placeholder="Paperback" value={edition.format} maxLength={LIMITS.editionFormat}
                    onChange={(e) => set("editions", form.editions.map((x, j) => (j === i ? { ...x, format: e.target.value } : x)))} />
                  <input aria-label={`ISBN ${i + 1}`} className={`${small} w-56 font-mono`} placeholder="ISBN" value={edition.isbn ?? ""} maxLength={24}
                    onChange={(e) => set("editions", form.editions.map((x, j) => (j === i ? { ...x, isbn: e.target.value } : x)))} />
                  <button type="button" className={iconBtn} onClick={() => set("editions", form.editions.filter((_, j) => j !== i))} aria-label={`Remove format ${i + 1}`}>Remove</button>
                </li>
              ))}
            </ul>
            <datalist id="edition-formats">
              {["Paperback", "Hardcover", "eBook (EPUB)", "eBook (Kindle)", "Audiobook"].map((f) => <option key={f} value={f} />)}
            </datalist>
            {errors.editions && <p className="text-sm text-[#6b1f1f] mt-2" role="alert">{errors.editions}</p>}
            <button type="button" className="mt-3 text-sm underline underline-offset-4 hover:text-[#6b1f1f] disabled:opacity-40" disabled={form.editions.length >= LIMITS.editions}
              onClick={() => set("editions", [...form.editions, { format: "", isbn: "" }])}>
              + Add a format
            </button>
          </div>
        </section>

        {/* RETAILERS */}
        <section aria-labelledby="s-retailers">
          <h2 id="s-retailers" className={`${sectionTitle} mb-3`}>Where to find it</h2>
          <p className="text-xs text-[#1a1816]/50 mb-3">
            Any platform: type its name and paste the direct https link. They appear in this order. Nothing is fetched from these links.
          </p>
          <ul className="space-y-3">
            {form.retailers.map((r, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <input aria-label={`Retailer ${i + 1} name`} className={`${small} w-44`} placeholder="Platform name" value={r.name} maxLength={LIMITS.retailerName}
                  onChange={(e) => set("retailers", form.retailers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <input aria-label={`Retailer ${i + 1} link`} className={`${small} min-w-0 flex-1 basis-64`} placeholder="https://…" value={r.url} maxLength={LIMITS.retailerUrl}
                  onChange={(e) => set("retailers", form.retailers.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                <button type="button" className={iconBtn} disabled={i === 0} onClick={() => set("retailers", move(form.retailers, i, -1))} aria-label={`Move retailer ${i + 1} up`}>↑</button>
                <button type="button" className={iconBtn} disabled={i === form.retailers.length - 1} onClick={() => set("retailers", move(form.retailers, i, 1))} aria-label={`Move retailer ${i + 1} down`}>↓</button>
                <button type="button" className={iconBtn} onClick={() => set("retailers", form.retailers.filter((_, j) => j !== i))} aria-label={`Remove retailer ${i + 1}`}>Remove</button>
              </li>
            ))}
          </ul>
          {errors.retailers && <p className="text-sm text-[#6b1f1f] mt-2" role="alert">{errors.retailers}</p>}
          <button type="button" className="mt-3 text-sm underline underline-offset-4 hover:text-[#6b1f1f] disabled:opacity-40" disabled={form.retailers.length >= LIMITS.retailers}
            onClick={() => set("retailers", [...form.retailers, { name: "", url: "" }])}>
            + Add a link
          </button>
        </section>

        {/* RELATED */}
        <section aria-labelledby="s-related">
          <h2 id="s-related" className={`${sectionTitle} mb-3`}>Related reading</h2>
          <p className="text-xs text-[#1a1816]/50 mb-3">Existing Thinking articles, Answers and service pages only. They appear grouped on the page, in this order.</p>
          <ul className="space-y-2">
            {form.related.map((path, i) => (
              <li key={path} className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 basis-64 text-sm [overflow-wrap:anywhere]">
                  <span className="mr-2 text-xs uppercase tracking-widest text-[#1a1816]/45">{relatedByPath.get(path) ? RELATED_KIND_LABEL[relatedByPath.get(path)!.kind] : "Removed page"}</span>
                  {relatedByPath.get(path)?.title ?? path}
                </span>
                <button type="button" className={iconBtn} disabled={i === 0} onClick={() => set("related", move(form.related, i, -1))} aria-label={`Move related link ${i + 1} up`}>↑</button>
                <button type="button" className={iconBtn} disabled={i === form.related.length - 1} onClick={() => set("related", move(form.related, i, 1))} aria-label={`Move related link ${i + 1} down`}>↓</button>
                <button type="button" className={iconBtn} onClick={() => set("related", form.related.filter((p) => p !== path))} aria-label={`Remove related link ${i + 1}`}>Remove</button>
              </li>
            ))}
          </ul>
          {errors.related && <p className="text-sm text-[#6b1f1f] mt-2" role="alert">{errors.related}</p>}
          {form.related.length < LIMITS.related && (
            <div className="mt-3">
              <label htmlFor="f-related-add" className="sr-only">Add a related page</label>
              <select id="f-related-add" className={`${small} max-w-full`} value="" onChange={(e) => { if (e.target.value) set("related", [...form.related, e.target.value]); }}>
                <option value="">+ Add a page…</option>
                {(["thinking", "answers", "service"] as const).map((kind) => (
                  <optgroup key={kind} label={RELATED_KIND_LABEL[kind]}>
                    {availableRelated.filter((o) => o.kind === kind).map((o) => <option key={o.path} value={o.path}>{o.title}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
        </section>

        {/* ACTIONS */}
        <section className="space-y-6 border-t border-[#1a1816]/15 pt-8" aria-labelledby="s-actions">
          <h2 id="s-actions" className={sectionTitle}>Save and publish</h2>

          <div>
            <button
              type="submit"
              disabled={busy !== null || !dirty}
              className="text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-6 py-3 hover:bg-[#6b1f1f]/90 disabled:opacity-50"
            >
              {busy === "save" ? "Saving…" : pub.published ? "Save live edit" : "Save draft"}
            </button>
            <span className="ml-4 text-xs text-[#1a1816]/55">{dirty ? "You have unsaved changes." : "Everything is saved."}</span>
          </div>

          {!pub.published && (
            <div className="space-y-3 border border-[#1a1816]/15 bg-white p-5 text-sm">
              <p className="font-semibold">Before publishing</p>
              <p className="text-xs text-[#1a1816]/55">Judged on the saved version, which is what gets published.</p>
              {blockers.length > 0 ? (
                <ul className="list-disc pl-5 text-[#6b1f1f]">{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
              ) : (
                <p className="text-[#1a1816]/75">The required text is complete.</p>
              )}
              {warnings.length > 0 && <ul className="list-disc pl-5 text-[#1a1816]/65">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
              <button
                type="button"
                onClick={() => changeStatus("publish")}
                disabled={busy !== null || dirty || blockers.length > 0}
                className="mt-2 text-sm font-semibold tracking-widest uppercase border border-[#6b1f1f] text-[#6b1f1f] px-6 py-3 hover:bg-[#6b1f1f] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#6b1f1f]"
              >
                {busy === "publish" ? "Publishing…" : "Publish"}
              </button>
              {dirty && <p className="text-xs text-[#1a1816]/55">Save your changes first. Publishing uses the saved version.</p>}
            </div>
          )}

          {pub.published && (
            <div className="space-y-4 border border-[#1a1816]/15 bg-white p-5 text-sm">
              {warnings.length > 0 && (
                <ul className="list-disc pl-5 text-[#1a1816]/65">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
              )}
              <div className="flex flex-wrap items-center gap-4">
                {pub.featured ? (
                  <button type="button" onClick={() => changeFeatured(false)} disabled={busy !== null} className="text-xs uppercase tracking-widest underline underline-offset-4 disabled:opacity-40">
                    Remove from homepage
                  </button>
                ) : (
                  <button type="button" onClick={() => changeFeatured(true)} disabled={busy !== null} className="text-xs uppercase tracking-widest underline underline-offset-4 disabled:opacity-40">
                    Feature on homepage
                  </button>
                )}
                <span className="text-xs text-[#1a1816]/50">Only one title is featured; featuring this one replaces the current one.</span>
              </div>
              <button
                type="button"
                onClick={() => changeStatus("unpublish")}
                disabled={busy !== null || dirty}
                className="text-sm font-semibold tracking-widest uppercase border border-[#6b1f1f] text-[#6b1f1f] px-6 py-3 hover:bg-[#6b1f1f] hover:text-white disabled:opacity-40"
              >
                {busy === "unpublish" ? "Unpublishing…" : "Unpublish"}
              </button>
              {dirty && <p className="text-xs text-[#1a1816]/55">Save or discard your changes first.</p>}
            </div>
          )}

          {!pub.published && (
            <button type="button" onClick={deleteDraft} disabled={busy !== null} className="text-xs uppercase tracking-widest underline underline-offset-4 text-[#1a1816]/55 hover:text-[#6b1f1f] disabled:opacity-40">
              Delete this draft
            </button>
          )}
        </section>
      </form>
    </div>
  );
}
