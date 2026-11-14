"use client";

import { useState, type FormEvent } from "react";
import { normalizeBlock, type NewsletterBlock } from "@/app/lib/email-studio/render";

export default function NewsletterBlockForm({ initial, storageOrigin, editing, save, remove, close }: {
  initial: NewsletterBlock;
  storageOrigin: string;
  editing: boolean;
  save: (block: NewsletterBlock) => boolean;
  remove: () => void;
  close: () => void;
}) {
  const [block, setBlock] = useState(initial);
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const image = block.kind === "image";
  const field = "rounded-lg border border-[#daccc1] bg-white px-2 py-1.5";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      let url = block.url;
      if (image && file) {
        if (file.size > 3 * 1024 * 1024) throw new Error("The image must be 3 MB or smaller.");
        const response = await fetch("/api/admin/email/images", { method: "POST", body: file });
        const data = await response.json();
        if (!response.ok || typeof data.url !== "string") throw new Error(data.error || "Image upload failed.");
        url = data.url;
      }
      const valid = normalizeBlock({ ...block, url }, storageOrigin);
      if (!valid) throw new Error(image ? "Choose a valid image." : "Enter button text and a full HTTPS link.");
      if (!save(valid)) throw new Error("The selected block changed. Close this panel and select it again.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The block could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  return <form aria-label={image ? "Image settings" : "Button settings"} onSubmit={submit} className="border-x border-[#e8dbd0] bg-[#fffcf8] p-3 text-sm"
    onKeyDown={(event) => { if (event.key === "Escape" && !busy) close(); }}>
    <fieldset disabled={busy} className="grid gap-3">
      <legend className="mb-2 font-serif text-base text-[#6b1f1f]">{editing ? "Edit" : "Insert"} {image ? "image" : "button"}</legend>
      {image && !editing && <label className="grid gap-1">Image file · JPG, PNG, WebP up to 3 MB
        <input autoFocus type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => setFile(event.target.files?.[0])} />
      </label>}
      <label className="grid gap-1">{image ? "Alternative text" : "Button text"}
        <input autoFocus={!image || editing} className={field} value={block.text} required={!image} maxLength={200}
          onChange={(event) => setBlock({ ...block, text: event.target.value })} />
      </label>
      {!image && <label className="grid gap-1">Destination URL
        <input type="url" required placeholder="https://example.com/article" className={field} value={block.url}
          onChange={(event) => setBlock({ ...block, url: event.target.value })} />
      </label>}
      <div className="flex flex-wrap gap-3">
        <label className="grid gap-1">Alignment<select aria-label="Block alignment" className={field} value={block.align} onChange={(event) => setBlock({ ...block, align: event.target.value as NewsletterBlock["align"] })}>
          <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
        </select></label>
        <label className="grid gap-1">{image ? "Width" : "Style"}<select aria-label={image ? "Width" : "Style"} className={field} value={block.variant} onChange={(event) => setBlock({ ...block, variant: event.target.value as NewsletterBlock["variant"] })}>
          {image ? <><option value="small">Small</option><option value="medium">Medium</option><option value="full">Full width</option></> :
            <><option value="primary">Primary</option><option value="secondary">Secondary</option></>}
        </select></label>
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="rounded-lg bg-[#6b1f1f] px-3 py-1.5 text-white">{busy ? "Saving…" : editing ? "Save changes" : image ? "Upload and insert" : "Insert button"}</button>
        {editing && <button type="button" className="text-[#6b1f1f]" onClick={remove}>Remove from newsletter</button>}
        <button type="button" onClick={close}>Cancel</button>
      </div>
    </fieldset>
    {error && <p className="mt-2 text-[#6b1f1f]" role="alert">{error}</p>}
  </form>;
}
