"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { trackEvent } from "@/app/lib/analytics";
import {
  DEFAULT_PROGRAM_NUMBER,
  PROGRAMS,
  bespokeFollowUp,
  ctaExplainer,
  ctaHref,
  formatPrice,
  hashFor,
  programFromHash,
  programPath,
  type ServiceProgram,
} from "@/app/lib/service-programs/catalog";
import { BulletList, H4, ProcessList } from "./ProgramSections";

/*
 * A real slider: one continuous track, eight stops, a draggable handle that tracks the pointer, magnetic
 * snapping on release, and live content that follows the handle. Eight independent entry points; the track
 * is deliberately NOT filled, so it never reads as progress through stages.
 *
 * Accessibility: the handle is a single role="slider" (arrow keys, Home/End, PageUp/PageDown) with a spoken
 * value of "Program N of 8: <situation>". Pointer interaction uses Pointer Events with touch-action: pan-y,
 * so vertical page scrolling still works from the track.
 *
 * URL: the committed selection lives in the hash (#program-03) so programs are deep-linkable and Back/Forward
 * work. The hash is written on release (not on every pixel of a drag); rapid keyboard steps replace the history
 * entry instead of piling up new ones.
 */

const LAST = PROGRAMS.length - 1;

/* ---------- hash store (shared by all consumers on the page) ---------- */
const listeners = new Set<() => void>();
const subscribeHash = (notify: () => void) => {
  listeners.add(notify);
  window.addEventListener("hashchange", notify);
  window.addEventListener("popstate", notify);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("hashchange", notify);
    window.removeEventListener("popstate", notify);
  };
};
const getHash = () => window.location.hash;
const getServerHash = () => "";
let lastCommitAt = 0;

function commit(program: ServiceProgram, source: "drag" | "keyboard" | "tap") {
  if (window.location.hash === hashFor(program)) return;
  const now = Date.now();
  const replace = lastCommitAt > 0 && now - lastCommitAt < 1200;
  (replace ? window.history.replaceState : window.history.pushState).call(window.history, null, "", hashFor(program));
  lastCommitAt = now;
  listeners.forEach((l) => l());
  trackEvent("program_select", { program: program.number, source });
}

/* ---------- reduced motion ---------- */
const MQ = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (notify: () => void) => {
  const mq = window.matchMedia(MQ);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
};
const getReduced = () => window.matchMedia(MQ).matches;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export default function ProgramSlider() {
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);
  const reduced = useSyncExternalStore(subscribeMotion, getReduced, () => false);
  const committed = Math.max(
    0,
    PROGRAMS.findIndex((p) => p.number === (programFromHash(hash)?.number ?? DEFAULT_PROGRAM_NUMBER)),
  );

  const [drag, setDrag] = useState<number | null>(null); // fractional stop while dragging, else null
  const [touched, setTouched] = useState(false);
  const [settle, setSettle] = useState(0); // bumps on every snap so the ring animation replays
  const innerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const lastShown = useRef(committed);

  const shown = drag !== null ? clamp(Math.round(drag), 0, LAST) : committed;
  const program = PROGRAMS[shown];

  // A deep link lands on the selector.
  useEffect(() => {
    if (programFromHash(window.location.hash)) sectionRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, []);

  // Light haptic tick each time the handle crosses into a new stop (only where the device supports it).
  useEffect(() => {
    if (shown === lastShown.current) return;
    lastShown.current = shown;
    if (!reduced && drag !== null) navigator.vibrate?.(6);
  }, [shown, drag, reduced]);

  const posFromClientX = useCallback((clientX: number) => {
    const r = innerRef.current!.getBoundingClientRect();
    return clamp((clientX - r.left) / r.width, 0, 1) * LAST;
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setTouched(true);
    setDrag(posFromClientX(e.clientX));
    if (e.pointerType === "mouse") handleRef.current?.focus({ preventScroll: true });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag === null) return;
    setDrag(posFromClientX(e.clientX));
  };
  const release = (e: React.PointerEvent) => {
    if (drag === null) return;
    const idx = clamp(Math.round(posFromClientX(e.clientX)), 0, LAST);
    setDrag(null);
    setSettle((n) => n + 1);
    commit(PROGRAMS[idx], e.pointerType === "mouse" ? "drag" : "tap");
    // A mouse click moves focus to <body> after pointerdown; put it back on the handle so arrow keys keep working.
    if (e.pointerType === "mouse") handleRef.current?.focus({ preventScroll: true });
  };
  // pointercancel means the browser took the gesture (e.g. a vertical page scroll that began on the track).
  // Its coordinates are meaningless (0,0), so revert to the committed stop instead of snapping anywhere.
  const cancel = () => setDrag(null);

  const step = (to: number) => {
    const idx = clamp(to, 0, LAST);
    setTouched(true);
    setSettle((n) => n + 1);
    commit(PROGRAMS[idx], "keyboard");
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = {
      ArrowRight: committed + 1, ArrowUp: committed + 1,
      ArrowLeft: committed - 1, ArrowDown: committed - 1,
      PageUp: committed + 2, PageDown: committed - 2,
      Home: 0, End: LAST,
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    step(map[e.key]);
  };

  const pos = drag ?? committed; // handle position in stop units
  const dragging = drag !== null;
  const animateHandle = !dragging && !reduced;

  return (
    <section ref={sectionRef} id="programs" aria-labelledby="selector-heading" className="scroll-mt-16 px-6 md:px-12 lg:px-16">
      <div className="mx-auto max-w-6xl pb-12 pt-8 md:pb-16 md:pt-14">
        <h2 id="selector-heading" className="text-2xl font-light leading-tight tracking-tight md:text-4xl">
          Find where you are.
        </h2>
        <p className="mt-2 max-w-2xl text-base text-[#1a1816]/75 md:text-lg">
          Move the slider to explore the program that fits your situation.
        </p>

        {/* ---------- SLIDER ---------- */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={release}
          onPointerCancel={cancel}
          style={{ touchAction: "pan-y" }}
          className={["mt-5 select-none md:mt-8", dragging ? "cursor-grabbing" : "cursor-grab"].join(" ")}
        >
          {/* tablet and phone: the selected situation, in full, above the track (wide screens label every stop instead) */}
          <p aria-hidden className="mb-1 min-h-[3.25rem] text-lg font-medium leading-snug text-[#6b1f1f] lg:hidden">
            <span className="mr-2 text-sm tabular-nums opacity-70">{program.number}</span>
            {program.hook}
          </p>

          <div ref={innerRef} className="relative mx-8 h-16">
            {/* rail: a plain line, deliberately not filled */}
            <span aria-hidden className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#1a1816]/30" />
            {PROGRAMS.map((p, i) => (
              <span
                key={p.number}
                aria-hidden
                style={{ left: `${(i / LAST) * 100}%` }}
                className={[
                  "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200",
                  i === shown ? "h-3 w-3 bg-[#6b1f1f]" : "h-2 w-2 bg-[#1a1816]/45",
                ].join(" ")}
              />
            ))}

            {/* handle */}
            <div
              ref={handleRef}
              role="slider"
              tabIndex={0}
              aria-label="Business situation"
              aria-orientation="horizontal"
              aria-valuemin={1}
              aria-valuemax={PROGRAMS.length}
              aria-valuenow={shown + 1}
              aria-valuetext={`Program ${program.number} of ${PROGRAMS.length}: ${program.hook}. ${program.name}`}
              aria-controls="program-stage"
              onKeyDown={onKeyDown}
              style={{
                left: `${(pos / LAST) * 100}%`,
                transition: animateHandle ? "left 320ms cubic-bezier(0.34, 1.45, 0.64, 1), transform 200ms ease, box-shadow 200ms ease" : "transform 120ms ease, box-shadow 120ms ease",
              }}
              className={[
                "absolute top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#6b1f1f] text-white outline-none",
                "focus-visible:ring-2 focus-visible:ring-[#6b1f1f] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f5f1ed]",
                dragging ? "scale-110 shadow-[0_10px_28px_rgba(107,31,31,0.38)]" : "shadow-[0_4px_14px_rgba(26,24,22,0.28)]",
              ].join(" ")}
            >
              <span aria-hidden className="flex gap-[3px]">
                <span className="h-4 w-[2px] rounded bg-white/85" />
                <span className="h-4 w-[2px] rounded bg-white/85" />
                <span className="h-4 w-[2px] rounded bg-white/85" />
              </span>
              {/* snap ring: replays each time the handle settles on a stop */}
              {!reduced && settle > 0 && <span key={settle} aria-hidden className="slider-snap-ring pointer-events-none absolute inset-0 rounded-full border-2 border-[#6b1f1f]" />}
              {/* first-visit invitation */}
              {!reduced && !touched && <span aria-hidden className="slider-invite-ring pointer-events-none absolute inset-0 rounded-full border-2 border-[#6b1f1f]" />}
            </div>
          </div>

          {/* stop labels: full first-person situations on laptops and up, shorter ones on tablets, numbers on phones */}
          <div aria-hidden className="relative mx-8 hidden h-[4.25rem] lg:block">
            {PROGRAMS.map((p, i) => (
              <span
                key={p.number}
                style={{ left: `${(i / LAST) * 100}%` }}
                className={["absolute top-0 w-[7.25rem] -translate-x-1/2 text-center text-[13px] leading-snug transition-colors duration-200 xl:w-[8.5rem] xl:text-sm", i === shown ? "font-semibold text-[#6b1f1f]" : "text-[#1a1816]/70"].join(" ")}
              >
                {p.hook}
              </span>
            ))}
          </div>
          <div aria-hidden className="relative mx-8 hidden h-9 md:block lg:hidden">
            {PROGRAMS.map((p, i) => (
              <span
                key={p.number}
                style={{ left: `${(i / LAST) * 100}%` }}
                className={["absolute top-0 w-[5.25rem] -translate-x-1/2 text-center text-xs leading-tight transition-colors duration-200", i === shown ? "font-semibold text-[#6b1f1f]" : "text-[#1a1816]/70"].join(" ")}
              >
                {p.hookShort}
              </span>
            ))}
          </div>
          <div aria-hidden className="relative mx-8 h-5 md:hidden">
            {PROGRAMS.map((p, i) => (
              <span
                key={p.number}
                style={{ left: `${(i / LAST) * 100}%` }}
                className={["absolute top-0 -translate-x-1/2 text-xs tabular-nums", i === shown ? "font-semibold text-[#6b1f1f]" : "text-[#1a1816]/70"].join(" ")}
              >
                {p.number}
              </span>
            ))}
          </div>
        </div>
        <p className={["mt-1 text-sm text-[#1a1816]/70 transition-opacity duration-300", touched ? "opacity-0" : "opacity-100"].join(" ")} aria-hidden={touched}>
          Drag the handle, tap the track, or use the arrow keys.
        </p>

        {/* ---------- SELECTED PROGRAM ----------
            On laptops and up all eight cards share one grid cell, so the card is always as tall as the tallest one: no layout shift.
            Inactive cards are not focusable and not announced. */}
        <div id="program-stage" role="region" aria-label="Selected program" className="mt-4 grid rounded-sm border border-[#1a1816]/10 bg-white shadow-[0_1px_0_rgba(26,24,22,0.04),0_12px_32px_-18px_rgba(26,24,22,0.25)] md:mt-6">
          {PROGRAMS.map((p) => (
            <ProgramCard key={p.number} program={p} active={p.number === program.number} reduced={reduced} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b1f1f]">{label}</dt>
      <dd className="text-base leading-relaxed text-[#1a1816]">{children}</dd>
    </div>
  );
}

function ProgramCard({ program: p, active, reduced }: { program: ServiceProgram; active: boolean; reduced: boolean }) {
  const followUp = bespokeFollowUp(p);
  return (
    <div
      data-panel={p.number}
      data-active={active}
      aria-hidden={!active}
      style={{ transition: reduced ? "none" : "opacity 200ms ease, visibility 200ms" }}
      className={[
        "p-5 md:p-8 lg:col-start-1 lg:row-start-1",
        // Laptops and up: all cards share one cell (no height change between selections). Below lg only the active card is rendered, so there is no empty reserve on phones.
        active ? "visible opacity-100" : "max-lg:hidden lg:invisible lg:opacity-0",
      ].join(" ")}
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#6b1f1f]">
            Program {p.number} <span aria-hidden>·</span> {p.duration}
          </p>
          {p.durationQualifier && <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#1a1816]/85">{p.durationQualifier}</p>}
          <h3 className="mt-3 text-2xl font-light leading-tight tracking-tight md:text-3xl">{p.name}</h3>
          <dl className="mt-5 divide-y divide-[#1a1816]/12 border-y border-[#1a1816]/12">
            <Row label="Who it’s for">{p.who}</Row>
            <Row label="What we do">{p.help}</Row>
            <Row label="What you receive">{p.receive}</Row>
          </dl>
        </div>

        <div className="flex flex-col justify-center lg:border-l lg:border-[#1a1816]/12 lg:pl-12">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1a1816]/70">{p.pricing.kind === "fixed" ? "Investment · fixed fee" : "Investment"}</p>
          <p className="mt-1 text-4xl font-medium tabular-nums leading-none text-[#1a1816]">{formatPrice(p)}</p>
          {p.priceNote && <p className="mt-2 text-sm text-[#1a1816]/80">{p.priceNote}</p>}
          <Link
            href={ctaHref(p)}
            tabIndex={active ? 0 : -1}
            onClick={() => trackEvent("program_cta_click", { program: p.number, intent: p.cta.intent })}
            className="mt-6 inline-flex min-h-14 w-full items-center justify-center bg-[#6b1f1f] px-6 py-3 text-base font-semibold tracking-wide text-white transition-colors duration-200 hover:bg-[#531818] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6b1f1f]"
          >
            {p.cta.label}
          </Link>
          <p className="mt-3 text-sm font-medium text-[#1a1816]">{ctaExplainer()}</p>
        </div>
      </div>

      <details className="group mt-6 border-t border-[#1a1816]/12 pt-1">
        <summary tabIndex={active ? 0 : -1} className="flex min-h-12 cursor-pointer list-none items-center justify-between text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f] [&::-webkit-details-marker]:hidden">
          Process, scope and full details
          <span aria-hidden className="text-xl text-[#6b1f1f] transition-transform duration-200 group-open:rotate-45">+</span>
        </summary>
        <div className="grid gap-8 pb-1 pt-4 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-5">
            <div>
              <h4 className={H4}>Who it’s for, in full</h4>
              <p className="mt-2 text-base leading-relaxed text-[#1a1816]/85">{p.fit}</p>
            </div>
            {p.positioning && <p className="border-l-2 border-[#6b1f1f] pl-4 text-base italic text-[#1a1816]/90">{p.positioning}</p>}
            <div>
              <h4 className={H4}>How it’s delivered</h4>
              <p className="mt-2 text-base leading-relaxed text-[#1a1816]/85">{p.delivery}</p>
            </div>
            <div>
              <h4 className={`mb-3 ${H4}`}>How it works</h4>
              <ProcessList program={p} />
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <h4 className={H4}>The deliverable</h4>
              <p className="mt-2 text-base leading-relaxed text-[#1a1816]/85">{p.deliverable}</p>
            </div>
            <div>
              <h4 className={`mb-3 ${H4}`}>Good to know</h4>
              <BulletList items={p.boundaries} />
            </div>
            {p.more && (
              <div>
                <h4 className={`mb-3 ${H4}`}>{p.more.title}</h4>
                <BulletList items={p.more.items} />
              </div>
            )}
            {followUp && <p className="text-sm leading-relaxed text-[#1a1816]/80">{followUp}</p>}
            {p.note && <p className="text-sm leading-relaxed text-[#1a1816]/80">{p.note}</p>}
            <Link href={programPath(p)} tabIndex={active ? 0 : -1} className="inline-flex min-h-11 items-center text-sm font-semibold text-[#6b1f1f] underline underline-offset-4">
              Full details for {p.name} →
            </Link>
          </div>
        </div>
      </details>
    </div>
  );
}
