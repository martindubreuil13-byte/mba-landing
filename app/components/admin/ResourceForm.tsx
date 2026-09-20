"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { RESOURCE_TYPES, type Resource } from "@/app/lib/resources/types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ResourceForm({
  mode,
  resource,
}: {
  mode: "create" | "edit";
  resource?: Resource;
}) {
  const router = useRouter();

  const [title, setTitle] = React.useState(resource?.title ?? "");
  const [slug, setSlug] = React.useState(resource?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(mode === "edit");
  const [shortDescription, setShortDescription] = React.useState(resource?.short_description ?? "");
  const [longDescription, setLongDescription] = React.useState(resource?.long_description ?? "");
  const [resourceType, setResourceType] = React.useState(resource?.resource_type ?? RESOURCE_TYPES[0]);
  const [audience, setAudience] = React.useState(resource?.audience ?? "");
  const [published, setPublished] = React.useState(resource?.published ?? false);
  const [featured, setFeatured] = React.useState(resource?.featured ?? false);
  const [file, setFile] = React.useState<File | null>(null);
  const [cover, setCover] = React.useState<File | null>(null);

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitError, setSubmitError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrors({});
    setSubmitError("");

    const formData = new FormData();
    formData.set("title", title);
    formData.set("slug", slug);
    formData.set("short_description", shortDescription);
    formData.set("long_description", longDescription);
    formData.set("resource_type", resourceType);
    formData.set("audience", audience);
    formData.set("published", String(published));
    formData.set("featured", String(featured));
    if (file) formData.set("file", file);
    if (cover) formData.set("cover", cover);

    const url =
      mode === "create" ? "/api/admin/resources" : `/api/admin/resources/${resource!.id}`;

    const res = await fetch(url, { method: mode === "create" ? "POST" : "PATCH", body: formData });
    const data = await res.json();

    if (!res.ok) {
      if (data.fieldErrors) setErrors(data.fieldErrors);
      setSubmitError(data.error || "Something went wrong.");
      setSubmitting(false);
      return;
    }

    router.push("/admin/resources");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <label className="block text-sm text-[#1a1816]/70 mb-2">Title</label>
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 focus:outline-none focus:border-[#6b1f1f]"
        />
        {errors.title && <p className="text-sm text-[#6b1f1f] mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm text-[#1a1816]/70 mb-2">Slug</label>
        <input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 focus:outline-none focus:border-[#6b1f1f]"
        />
        <p className="text-xs text-[#1a1816]/40 mt-1">/resources/{slug || "…"}</p>
        {errors.slug && <p className="text-sm text-[#6b1f1f] mt-1">{errors.slug}</p>}
      </div>

      <div>
        <label className="block text-sm text-[#1a1816]/70 mb-2">Short description</label>
        <textarea
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          rows={2}
          className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 focus:outline-none focus:border-[#6b1f1f]"
        />
        {errors.short_description && (
          <p className="text-sm text-[#6b1f1f] mt-1">{errors.short_description}</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-[#1a1816]/70 mb-2">
          Long description <span className="text-[#1a1816]/40">(optional — separate paragraphs with a blank line)</span>
        </label>
        <textarea
          value={longDescription}
          onChange={(e) => setLongDescription(e.target.value)}
          rows={8}
          className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 focus:outline-none focus:border-[#6b1f1f]"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm text-[#1a1816]/70 mb-2">Resource type</label>
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 focus:outline-none focus:border-[#6b1f1f]"
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.resource_type && (
            <p className="text-sm text-[#6b1f1f] mt-1">{errors.resource_type}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-[#1a1816]/70 mb-2">
            Audience <span className="text-[#1a1816]/40">(optional)</span>
          </label>
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 focus:outline-none focus:border-[#6b1f1f]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-[#1a1816]/70 mb-2">
          File {mode === "edit" && resource?.file_name && (
            <span className="text-[#1a1816]/40">(current: {resource.file_name} — leave blank to keep)</span>
          )}
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
        {errors.file && <p className="text-sm text-[#6b1f1f] mt-1">{errors.file}</p>}
      </div>

      <div>
        <label className="block text-sm text-[#1a1816]/70 mb-2">
          Cover image{" "}
          <span className="text-[#1a1816]/40">
            (optional — leave blank to auto-generate one from the title)
          </span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCover(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
      </div>

      <div className="flex items-center gap-8">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 accent-[#6b1f1f]"
          />
          <span className="text-sm">Published</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 accent-[#6b1f1f]"
          />
          <span className="text-sm">Featured</span>
        </label>
      </div>

      {submitError && <p className="text-sm text-[#6b1f1f]">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 hover:bg-[#6b1f1f]/90 disabled:opacity-60"
      >
        {submitting ? "Saving…" : mode === "create" ? "Create Resource" : "Save Changes"}
      </button>
    </form>
  );
}
