"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, RectangleEllipsis, AlignLeft, Bold, Italic, Underline, List, ListOrdered, Link2, Undo2, Redo2, RemoveFormatting } from "lucide-react";
import "./newsletter-editor.css";
import type Quill from "quill";
import type { BlockEmbed } from "quill/blots/block";
import NewsletterBlockForm from "./NewsletterBlockForm";
import { colors, fonts, headingSizes, renderEmailBody, safeLink, sizes, normalizeBlock, renderNewsletterBlock, type NewsletterBlock } from "@/app/lib/email-studio/render";
import "quill/dist/quill.core.css";

function createNewsletterEmbed(Editor: typeof Quill, storageOrigin: string) {
  const Block = Editor.import("blots/block/embed") as typeof BlockEmbed;
  class NewsletterEmbed extends Block {
    static blotName = "newsletterBlock";
    static tagName = "div";
    static className = "newsletter-block";
    static create(value: unknown) {
      const node = super.create(value) as HTMLDivElement;
      node.contentEditable = "false";
      const block = normalizeBlock(value, storageOrigin);
      if (!block) return node;
      node.dataset.newsletter = JSON.stringify(block);
      node.innerHTML = renderNewsletterBlock(block, storageOrigin);
      // Links in the composer act as edit targets. The preview owns navigation.
      node.querySelectorAll("a").forEach((link) => link.removeAttribute("href"));
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "newsletter-edit-block";
      edit.textContent = block.kind === "image" ? "Edit image" : "Edit button";
      node.append(edit);
      return node;
    }
    static value(node: HTMLElement) {
      try { return normalizeBlock(JSON.parse(node.dataset.newsletter ?? "null"), storageOrigin); }
      catch { return null; }
    }
  }
  return NewsletterEmbed;
}

export default function NewsletterEditor({ onChange, storageOrigin, initialOperations, placeholder = "Write your newsletter…", label = "Newsletter message" }: { initialOperations?: import("quill").Op[]; placeholder?: string; label?: string; storageOrigin: string; onChange: (value: string, operations: ReturnType<Quill["getContents"]>["ops"]) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const editor = useRef<Quill>(null);
  const [status, setStatus] = useState("Loading editor…");
  const [panel, setPanel] = useState<{ block: NewsletterBlock; index: number; resolveIndex?: () => number | null }>();
  const blockTrigger = useRef<HTMLElement | null>(null);
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
      if (!instance) return;
      const operations = instance.getContents().ops;
      onChange(renderEmailBody(operations, storageOrigin), operations);
    };
    import("quill").then(({ default: Editor }) => {
      if (disposed) return;
      for (const [name, whitelist] of [
        ["formats/font", Object.keys(fonts)], ["attributors/style/size", sizes],
        // Clipboard text can carry arbitrary colors (for example Word's black).
        // Keep the Delta consistent with the renderer and server's palette.
        // Parchment checks CSSOM values before Quill converts RGB back to hex.
        ["attributors/style/color", colors.flatMap((hex) => [hex,
          `rgb(${[1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)).join(", ")})`,
        ])],
      ] as const) {
        const format = Editor.import(name) as { whitelist: readonly string[] };
        format.whitelist = whitelist;
        Editor.register(name.startsWith("attributors/style/") ? name.replace("attributors/style/", "formats/") : name, format, true);
      }
      const NewsletterEmbed = createNewsletterEmbed(Editor, storageOrigin);
      Editor.register(NewsletterEmbed, true);
      instance = new Editor(mount, {
        placeholder,
        formats: ["bold", "italic", "underline", "header", "list", "align", "link", "font", "size", "color", "newsletterBlock"],
        modules: { toolbar: { container: controls }, history: { userOnly: true } },
      });
      instance.root.setAttribute("role", "textbox");
      instance.root.setAttribute("aria-label", label);
      instance.root.setAttribute("aria-multiline", "true");
      instance.on("text-change", update);
      instance.on("selection-change", (selection) => { if (selection) range.current = selection; });
      instance.root.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) return;
        const node = event.target.closest<HTMLElement>(".newsletter-block");
        if (!node || !instance) return;
        const block = NewsletterEmbed.value(node);
        const blot = Editor.find(node);
        if (!block || !(blot instanceof NewsletterEmbed)) return;
        blockTrigger.current = node.querySelector("button");
        setLinkOpen(false);
        setPanel({ block, index: instance.getIndex(blot), resolveIndex: () => instance && instance.root.contains(node) ? instance.getIndex(blot) : null });
      });
      if (initialOperations) {
        instance.setContents(initialOperations, "silent");
        update();
      }
      editor.current = instance;
      setStatus("");
    }).catch(() => { if (!disposed) setStatus("The editor could not load. Reload to try again."); });
    return () => {
      disposed = true;
      instance?.off("text-change", update);
      editor.current = null;
      mount.remove();
    };
  }, [onChange, storageOrigin, initialOperations, placeholder, label]);

  useEffect(() => { if (linkOpen) linkInput.current?.focus(); }, [linkOpen]);

  function openBlock(kind: NewsletterBlock["kind"], trigger: HTMLElement) {
    const quill = editor.current;
    if (!quill) return;
    blockTrigger.current = trigger;
    const selection = quill.getSelection() ?? range.current;
    setLinkOpen(false);
    setPanel({
      block: { kind, url: "", text: "", align: "center", variant: kind === "image" ? "full" : "primary" },
      index: selection?.index ?? quill.getLength() - 1,
    });
  }

  function closeBlock() {
    setPanel(undefined);
    if (blockTrigger.current?.isConnected) blockTrigger.current.focus();
    else editor.current?.focus();
  }

  function changeBlock(block?: NewsletterBlock) {
    const quill = editor.current;
    if (!quill || !panel) return false;
    const current = panel.resolveIndex ? panel.resolveIndex() : panel.index;
    if (current === null) return false;
    const index = Math.min(current, quill.getLength() - 1);
    const delta = quill.getContents(0, 0).retain(index);
    if (panel.resolveIndex) delta.delete(1);
    if (block) delta.insert({ newsletterBlock: block });
    quill.history.cutoff();
    quill.updateContents(delta, "user");
    quill.history.cutoff();
    closeBlock();
    return true;
  }

  function openLink() {
    const quill = editor.current;
    if (!quill) return;
    range.current = quill.getSelection() ?? range.current;
    setUrl(String(range.current ? quill.getFormat(range.current).link ?? "" : ""));
    setLinkError("");
    setPanel(undefined);
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
    <div className="newsletter-toolbar">
    <div ref={toolbar} aria-label="Newsletter formatting" role="group">
      <div className="newsletter-tools">
        <span className="newsletter-group">
          <button type="button" className="ql-bold" aria-label="Bold" title="Bold"><Bold /></button>
          <button type="button" className="ql-italic" aria-label="Italic" title="Italic"><Italic /></button>
          <button type="button" className="ql-underline" aria-label="Underline" title="Underline"><Underline /></button>
        </span>
        <span className="newsletter-group">
          <button type="button" className="ql-list" value="bullet" aria-label="Bullet list" title="Bullet list"><List /></button>
          <button type="button" className="ql-list" value="ordered" aria-label="Numbered list" title="Numbered list"><ListOrdered /></button>
        </span>
        <span className="newsletter-group">
          <button ref={linkButton} type="button" title="Link" aria-label="Link" aria-expanded={linkOpen} onClick={openLink}><Link2 /></button>
          <button type="button" title="Clear formatting" aria-label="Clear formatting" className="ql-clean"><RemoveFormatting /></button>
        </span>
        <span className="newsletter-group">
          <button type="button" title="Insert image" aria-label="Insert image" onClick={(event) => openBlock("image", event.currentTarget)}><ImagePlus /></button>
          <button type="button" title="Insert button" aria-label="Insert button" onClick={(event) => openBlock("button", event.currentTarget)}><RectangleEllipsis /></button>
        </span>
        <span className="newsletter-group">
          <button type="button" title="Undo" aria-label="Undo" onClick={() => editor.current?.history.undo()}><Undo2 /></button>
          <button type="button" title="Redo" aria-label="Redo" onClick={() => editor.current?.history.redo()}><Redo2 /></button>
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <select aria-label="Paragraph style" className="ql-header" defaultValue="">
          <option value="">Paragraph</option>{Object.keys(headingSizes).map((level) => <option key={level} value={level}>Heading {level}</option>)}
        </select>
        <label className="newsletter-align" title="Text alignment"><AlignLeft aria-hidden /><select aria-label="Alignment" className="ql-align" defaultValue="">
          <option value="">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option>
        </select></label>
        <select aria-label="Font family" className="ql-font" defaultValue="">
          <option value="">Default</option>{Object.keys(fonts).map((font) => <option key={font} value={font}>{font === "courier" ? "Courier New" : font[0].toUpperCase() + font.slice(1)}</option>)}
        </select>
        <select aria-label="Font size" className="ql-size" defaultValue="">
          <option value="">Default</option>{sizes.map((size) => <option key={size}>{size}</option>)}
        </select>
        <select aria-label="Text color" className="ql-color" defaultValue="">
          <option value="">Default</option>{colors.map((color, i) => <option value={color} key={color}>{["Ink", "Oxblood", "Green", "Blue", "Warm gray"][i]}</option>)}
        </select>
      </div>
    </div>
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
    {panel && <NewsletterBlockForm key={panel.block.kind + ":" + panel.index + ":" + Boolean(panel.resolveIndex)}
      initial={panel.block} storageOrigin={storageOrigin} editing={Boolean(panel.resolveIndex)} save={changeBlock} remove={() => { changeBlock(); }} close={closeBlock} />}
    <div ref={host} className="newsletter-editor" />
    {status && <p role="status" className="mt-2 text-xs">{status}</p>}
  </div>;
}
