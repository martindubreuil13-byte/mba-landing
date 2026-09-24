"use client";

import React from "react";

type CopyablePromptProps = {
  id: string;
  label: string;
  text: string;
};

export default function CopyablePrompt({ id, label, text }: CopyablePromptProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (permissions, insecure context); fail quietly.
    }
  };

  return (
    <figure id={id} className="not-prose my-10 border border-[#1a1816]/20 bg-[#f7f4ef]">
      <div className="flex items-center justify-between gap-4 border-b border-[#1a1816]/15 px-5 md:px-7 py-4">
        <p className="text-xs tracking-widest uppercase font-semibold text-[#6b1f1f]">{label}</p>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
        >
          {copied ? "Copied" : "Copy prompt"}
        </button>
      </div>
      <pre className="px-5 md:px-7 py-6 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[#1a1816]/85">
        {text}
      </pre>
    </figure>
  );
}
