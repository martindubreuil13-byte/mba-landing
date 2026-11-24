"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type StudioMode = "newsletter" | "outreach";
const tabs: { id: StudioMode; label: string; hint: string }[] = [
  { id: "newsletter", label: "Newsletter", hint: "One message to many subscribers" },
  { id: "outreach", label: "Individual outreach", hint: "One email to one person" },
];

/**
 * The two ways to write in Email Studio. Both stay mounted, so switching never loses an unsent newsletter or an unsaved outreach email.
 * The mode is kept in the address (?mode=outreach), without a page load, so it can be bookmarked or linked.
 */
export default function EmailStudio({ initialMode, newsletter, outreach }: { initialMode: StudioMode; newsletter: ReactNode; outreach: ReactNode }) {
  const [mode, setMode] = useState<StudioMode>(initialMode);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function choose(next: StudioMode, focus = false) {
    setMode(next);
    const url = new URL(window.location.href);
    if (next === "outreach") url.searchParams.set("mode", "outreach"); else url.searchParams.delete("mode");
    window.history.replaceState(null, "", url);
    if (focus) refs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent, index: number) {
    const next = event.key === "ArrowRight" || event.key === "ArrowLeft" ? tabs[(index + 1) % tabs.length]
      : event.key === "Home" ? tabs[0] : event.key === "End" ? tabs[tabs.length - 1] : null;
    if (!next) return;
    event.preventDefault();
    choose(next.id, true);
  }

  return <div>
    <div role="tablist" aria-label="Email type" className="mb-5 flex flex-wrap gap-2">
      {tabs.map((tab, index) => <button key={tab.id} ref={(element) => { refs.current[tab.id] = element; }} type="button" role="tab" id={`studio-tab-${tab.id}`}
        aria-selected={mode === tab.id} aria-controls={`studio-panel-${tab.id}`} tabIndex={mode === tab.id ? 0 : -1}
        onClick={() => choose(tab.id)} onKeyDown={(event) => onKeyDown(event, index)}
        className={`rounded-xl border px-4 py-2 text-left ${mode === tab.id ? "border-[#6b1f1f] bg-[#6b1f1f] text-white" : "border-[#daccc1] bg-white text-[#27211d] hover:bg-[#efdfd8]"}`}>
        <span className="block font-medium">{tab.label}</span>
        <span className={`block text-xs ${mode === tab.id ? "text-white/85" : "text-[#655951]"}`}>{tab.hint}</span>
      </button>)}
    </div>
    <div role="tabpanel" id="studio-panel-newsletter" aria-labelledby="studio-tab-newsletter" hidden={mode !== "newsletter"}>{newsletter}</div>
    <div role="tabpanel" id="studio-panel-outreach" aria-labelledby="studio-tab-outreach" hidden={mode !== "outreach"}>{outreach}</div>
  </div>;
}
