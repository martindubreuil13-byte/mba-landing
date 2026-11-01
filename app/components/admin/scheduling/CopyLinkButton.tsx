"use client";
import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { textLink } from "@/app/components/scheduling/ui";

/** Copies an absolute booking link (the page's origin plus `path`). */
export default function CopyLinkButton({ path, label = "Copy link", onCopied }: { path: string; label?: string; onCopied?: (url: string) => void }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    const url = `${window.location.origin}${path}`;
    try { await navigator.clipboard.writeText(url); }
    catch {
      const t = document.createElement("textarea"); t.value = url; t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch { /* the toast still shows the link */ }
      document.body.removeChild(t);
    }
    setDone(true); onCopied?.(url); setTimeout(() => setDone(false), 2000);
  };
  return <button type="button" onClick={copy} className={`inline-flex items-center gap-1.5 ${textLink}`}>{done ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Link2 aria-hidden className="h-3.5 w-3.5" />}{done ? "Copied" : label}</button>;
}
