"use client";

import { useEffect, useRef, useState } from "react";
import type Quill from "quill";
import { colors, fonts, renderEmailBody, safeLink, sizes } from "@/app/lib/email-studio/render";
import "quill/dist/quill.core.css";

export default function NewsletterEditor({ onChange }: { onChange: (value: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const editor = useRef<Quill>(null);
  const [status, setStatus] = useState("Loading editor…");
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const linkInput = useRef<HTMLInputElement>(null);
  const linkButton = useRef<HTMLButtonElement>(null);
  const range = useRef<{ index: number; length: number } | null>(null);

  useEffect(() => {
    let disposed = false;
    const container = host.current!;
    const controls = toolbar.current!;
    let instance: Quill | undefined;
    // Quill owns these nodes, including the toolbar listeners it installs.
    const mount = document.createElement("div");
    container.appendChild(mount);
    const update = () => {
      if (instance) onChange(renderEmailBody(instance.getContents().ops));
    };
    import("quill").then(({ default: Editor }) => {
      if (disposed) return;
      for (const [name, whitelist] of [
        ["formats/font", Object.keys(fonts)], ["attributors/style/size", sizes],
      ] as const) {
        const format = Editor.import(name) as { whitelist: readonly string[] };
        format.whitelist = whitelist;
        Editor.register(name === "attributors/style/size" ? "formats/size" : name, format, true);
      }
      instance = new Editor(mount, {
        placeholder: "Write your newsletter…",
        formats: ["bold", "italic", "underline", "header", "list", "align", "link", "font", "size", "color"],
        modules: { toolbar: { container: controls }, history: { userOnly: true } },
      });
      instance.root.setAttribute("role", "textbox");
      instance.root.setAttribute("aria-label", "Newsletter message");
      instance.root.setAttribute("aria-multiline", "true");
      instance.on("text-change", update);
      instance.on("selection-change", (selection) => { if (selection) range.current = selection; });
      editor.current = instance;
      setStatus("");
    }).catch(() => { if (!disposed) setStatus("The editor could not load. Reload to try again."); });
    return () => {
      disposed = true;
      instance?.off("text-change", update);
      editor.current = null;
      mount.remove();
    };
  }, [onChange]);

  useEffect(() => { if (linkOpen) linkInput.current?.focus(); }, [linkOpen]);

  function openLink() {
    const quill = editor.current;
    if (!quill) return;
    range.current = quill.getSelection() ?? range.current;
    setUrl(String(range.current ? quill.getFormat(range.current).link ?? "" : ""));
    setLinkError("");
    setLinkOpen(true);
  }

  function closeLink() {
    setLinkOpen(false);
    linkButton.current?.focus();
  }

  function applyLink(remove = false) {
    const quill = editor.current;
    if (!quill) return;
    const selection = range.current ?? { index: Math.max(0, quill.getLength() - 1), length: 0 };
    const href = remove ? null : safeLink(url.trim());
    if (!remove && !href) {
      setLinkError("Enter a full HTTPS, HTTP, or mailto link.");
      return;
    }
    if (selection.length) quill.formatText(selection.index, selection.length, "link", href || false, "user");
    else if (href) quill.insertText(selection.index, url.trim(), { link: href }, "user");
    closeLink();
  }

  return <div className="min-w-0">
    <p className="mb-1 text-sm">Message</p>
    <div ref={toolbar} aria-label="Newsletter formatting" className="rounded-t-lg border border-[#daccc1] bg-white p-3 [&_button]:mr-2 [&_button]:rounded [&_button]:border [&_button]:px-2 [&_button]:py-1 [&_button.ql-active]:bg-[#eee4db] [&_select]:max-w-full [&_select]:rounded [&_select]:border [&_select]:p-1">
      <span className="ql-formats">
        <button type="button" className="ql-bold" aria-label="Bold" title="Bold">B</button>
        <button type="button" className="ql-italic" aria-label="Italic" title="Italic">I</button>
        <button type="button" className="ql-underline" aria-label="Underline" title="Underline">U</button>
        <button type="button" className="ql-list" value="bullet" aria-label="Bullet list" title="Bullet list">Bullets</button>
        <button type="button" className="ql-list" value="ordered" aria-label="Numbered list" title="Numbered list">Numbers</button>
        <button type="button" className="ql-clean" aria-label="Clear formatting" title="Clear formatting">Clear</button>
      </span>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <select aria-label="Paragraph style" className="ql-header" defaultValue="">
          <option value="">Paragraph</option><option value="1">Heading 1</option><option value="2">Heading 2</option>
        </select>
        <select aria-label="Alignment" className="ql-align" defaultValue="">
          <option value="">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option>
        </select>
        <select aria-label="Font family" className="ql-font" defaultValue="">
          <option value="">Default</option>{Object.keys(fonts).map((font) => <option key={font}>{font}</option>)}
        </select>
        <select aria-label="Font size" className="ql-size" defaultValue="">
          <option value="">Default</option>{sizes.map((size) => <option key={size}>{size}</option>)}
        </select>
        <select aria-label="Text color" className="ql-color" defaultValue="">
          <option value="">Default</option>{colors.map((color, i) => <option value={color} key={color}>{["Ink", "Oxblood", "Green", "Blue", "Warm gray"][i]}</option>)}
        </select>
      </div>
    </div>
    <div className="flex flex-wrap gap-3 border-x border-[#ccc] bg-white px-3 py-2 text-xs text-[#6b1f1f]">
      <button ref={linkButton} type="button" aria-expanded={linkOpen} onClick={openLink}>Link</button>
      <button type="button" onClick={() => editor.current?.history.undo()}>Undo</button>
      <button type="button" onClick={() => editor.current?.history.redo()}>Redo</button>
    </div>
    {linkOpen && <div className="grid gap-2 border-x border-[#ccc] bg-white p-3 text-sm" onKeyDown={(event) => {
      if (event.key === "Escape") closeLink();
      if (event.key === "Enter" && event.target === linkInput.current) { event.preventDefault(); applyLink(); }
    }}>
      <label>Link address <input ref={linkInput} type="text" value={url} onChange={(event) => setUrl(event.target.value)} className="w-full rounded border px-2 py-1" /></label>
      {linkError && <p role="alert">{linkError}</p>}
      <div className="flex gap-3"><button type="button" onClick={() => applyLink()}>Apply link</button>
        <button type="button" onClick={() => applyLink(true)}>Remove link</button><button type="button" onClick={closeLink}>Cancel</button></div>
    </div>}
    <div ref={host} className="newsletter-editor min-h-52 border border-[#daccc1] bg-white [&_a]:underline [&_.ql-editor]:focus-visible:outline-[#6b1f1f] [&_.ql-container]:min-h-52 [&_.ql-editor]:min-h-52" />
    {status && <p role="status" className="mt-2 text-xs">{status}</p>}
  </div>;
}
