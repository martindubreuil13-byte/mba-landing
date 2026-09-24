"use client";

import React from "react";
import { createPortal } from "react-dom";
import {
  CUSTOMER_ARCHITECTURE_MAP,
  CUSTOMER_ARCHITECTURE_MAP_INSTRUCTION,
  CUSTOMER_ARCHITECTURE_MAP_TITLE,
  customerArchitectureMapAsText,
} from "@/app/lib/customer-architecture/map";

type Variant = "screen" | "print";

// Blank writing lines. Real elements rather than a background gradient, so
// the rules stay crisp at any zoom level and in print.
function WritingLines({ count, print, className = "" }: { count: number; print: boolean; className?: string }) {
  return (
    <div aria-hidden="true" className={`flex flex-col justify-end ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`border-b border-[#1a1816]/15 ${print ? "h-[6mm]" : "h-7"}`} />
      ))}
    </div>
  );
}

function MapSheet({ variant }: { variant: Variant }) {
  const print = variant === "print";
  const sections = CUSTOMER_ARCHITECTURE_MAP.filter((s) => s.key !== "evidence");
  const evidence = CUSTOMER_ARCHITECTURE_MAP.find((s) => s.key === "evidence");

  return (
    <div
      className="bg-white text-[#1a1816] border border-[#1a1816]/20"
      style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      {/* Title block */}
      <div className={`border-b border-[#1a1816]/20 ${print ? "px-[5mm] py-[3.5mm]" : "px-5 md:px-7 py-6"}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className={`tracking-widest uppercase font-semibold text-[#6b1f1f] ${print ? "text-[9pt]" : "text-xs"}`}>
            {CUSTOMER_ARCHITECTURE_MAP_TITLE}
          </p>
          <p className={`tracking-widest uppercase text-[#1a1816]/45 ${print ? "text-[6.5pt]" : "text-[0.65rem]"}`}>
            The Modern Business Architect
          </p>
        </div>
        <p className={`text-[#1a1816]/60 ${print ? "text-[7.5pt] mt-[1.5mm]" : "text-sm mt-3"}`}>
          {CUSTOMER_ARCHITECTURE_MAP_INSTRUCTION}
        </p>
        <div className={`grid grid-cols-3 gap-4 ${print ? "mt-[3mm] text-[7pt]" : "mt-5 text-[0.7rem]"}`}>
          {["Customer", "Version", "Date"].map((field) => (
            <p key={field} className="tracking-widest uppercase text-[#1a1816]/45 border-b border-[#1a1816]/20 pb-1">
              {field}
            </p>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1a1816]/15" style={print ? { gridTemplateColumns: "1fr 1fr" } : undefined}>
        {sections.map((section, index) => (
          <div key={section.key} className={`bg-white flex flex-col ${print ? "px-[5mm] pt-[3mm] pb-[2mm] h-[35mm]" : "px-5 md:px-7 pt-6 pb-5"}`}>
            <div className="flex items-baseline gap-3">
              <span className={`text-[#1a1816]/35 tabular-nums ${print ? "text-[7pt]" : "text-xs"}`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={`tracking-widest uppercase font-semibold text-[#6b1f1f] ${print ? "text-[8pt]" : "text-xs"}`}>
                {section.label}
              </span>
            </div>
            <p className={`font-light leading-snug ${print ? "text-[9.5pt] mt-[1mm]" : "text-lg mt-2"}`}>{section.question}</p>
            <p className={`text-[#1a1816]/55 leading-snug ${print ? "text-[6.5pt] mt-[1mm]" : "text-sm mt-2"}`}>{print ? section.cue : section.prompts}</p>
            <WritingLines count={3} print={print} className={print ? "flex-1" : "mt-2"} />
          </div>
        ))}

        {evidence && (
          <div className={`bg-white md:col-span-2 ${print ? "px-[5mm] pt-[3mm] pb-[2mm] h-[35mm] flex flex-col" : "px-5 md:px-7 pt-6 pb-5"}`} style={print ? { gridColumn: "span 2" } : undefined}>
            <div className="flex items-baseline gap-3">
              <span className={`text-[#1a1816]/35 tabular-nums ${print ? "text-[7pt]" : "text-xs"}`}>
                {String(CUSTOMER_ARCHITECTURE_MAP.length).padStart(2, "0")}
              </span>
              <span className={`tracking-widest uppercase font-semibold text-[#6b1f1f] ${print ? "text-[8pt]" : "text-xs"}`}>
                {evidence.label}
              </span>
            </div>
            <p className={`font-light leading-snug ${print ? "text-[9.5pt] mt-[1mm]" : "text-lg mt-2"}`}>{evidence.question}</p>
            <p className={`text-[#1a1816]/55 leading-snug ${print ? "text-[6.5pt] mt-[1mm]" : "text-sm mt-2"}`}>{print ? evidence.cue : evidence.prompts}</p>
            <div className={`grid grid-cols-2 gap-6 ${print ? "flex-1 mt-[1.5mm]" : "mt-4"}`}>
              {["We know (K)", "We are assuming (A)"].map((column) => (
                <div key={column} className="flex flex-col">
                  <p className={`tracking-widest uppercase text-[#1a1816]/45 ${print ? "text-[6.5pt]" : "text-[0.65rem]"}`}>{column}</p>
                  <WritingLines count={3} print={print} className={print ? "flex-1" : "mt-1"} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {print && (
        <p className="px-[5mm] py-[2mm] text-[6.5pt] tracking-widest uppercase text-[#1a1816]/40 border-t border-[#1a1816]/20">
          modernbusinessarchitect.com/thinking/how-to-define-your-ideal-customer
        </p>
      )}
    </div>
  );
}

export default function CustomerArchitectureMap() {
  const [printing, setPrinting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!printing) return;

    const root = document.documentElement;
    const finish = () => {
      delete root.dataset.printTarget;
      setPrinting(false);
    };

    root.dataset.printTarget = "customer-map";
    window.addEventListener("afterprint", finish, { once: true });
    // Give the portal a frame to render before the print dialog snapshots the page.
    const frame = window.requestAnimationFrame(() => window.print());

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("afterprint", finish);
    };
  }, [printing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customerArchitectureMapAsText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (permissions, insecure context); fail quietly.
    }
  };

  const buttonClass =
    "text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60";

  return (
    <figure id="customer-architecture-map" className="not-prose my-12">
      <MapSheet variant="screen" />
      <figcaption className="mt-6 flex flex-wrap gap-6">
        <button type="button" onClick={() => setPrinting(true)} className={buttonClass}>
          Print the map
        </button>
        <button type="button" onClick={handleCopy} className={buttonClass}>
          {copied ? "Copied" : "Copy as text"}
        </button>
      </figcaption>

      {printing &&
        createPortal(
          <div id="customer-map-print-root">
            <MapSheet variant="print" />
          </div>,
          document.body,
        )}
    </figure>
  );
}
