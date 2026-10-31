"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/app/lib/publications/validation";
import { adminFetch } from "./api";

export default function NewPublicationForm() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setMessage("");
    const result = await adminFetch("/api/admin/publications", { method: "POST", json: { title, slug } });
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setMessage(result.error);
      setBusy(false);
      return;
    }
    router.push(`/admin/publications/${result.publication!.id}/edit`);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <div>
        <label htmlFor="pub-title" className="block text-sm text-[#1a1816]/70 mb-2">Title</label>
        <input
          id="pub-title"
          value={title}
          maxLength={200}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 focus:outline-none focus:border-[#6b1f1f]"
          required
        />
        {errors.title && <p className="text-sm text-[#6b1f1f] mt-1">{errors.title}</p>}
      </div>
      <div>
        <label htmlFor="pub-slug" className="block text-sm text-[#1a1816]/70 mb-2">URL slug</label>
        <input
          id="pub-slug"
          value={slug}
          maxLength={80}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#6b1f1f]"
        />
        <p className="text-xs text-[#1a1816]/50 mt-1">/publications/{slug || "…"}</p>
        {errors.slug && <p className="text-sm text-[#6b1f1f] mt-1">{errors.slug}</p>}
      </div>
      {message && !errors.title && !errors.slug && <p className="text-sm text-[#6b1f1f]" role="alert">{message}</p>}
      <button
        type="submit"
        disabled={busy || !title.trim()}
        className="text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-6 py-3 hover:bg-[#6b1f1f]/90 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save draft"}
      </button>
    </form>
  );
}
