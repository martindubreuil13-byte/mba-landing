"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Boxes, Factory, Handshake, Landmark, Library, Truck, type LucideIcon } from "lucide-react";
import { EXPLORER_DISCLAIMER, FUNCTIONS, type FunctionId } from "@/app/business-rearchitecture/content";
import { ringPoints } from "./geometry";

const ICONS: Record<FunctionId, LucideIcon> = {
  sales: Handshake,
  production: Factory,
  inventory: Boxes,
  logistics: Truck,
  finance: Landmark,
  people: Library,
};

const OXBLOOD = "#6b1f1f";
const IVORY = "#f5f1ed";
const CX = 210;
const CY = 195;
const NODE_R = 30;
const POSITIONS = ringPoints(FUNCTIONS.length, CX, CY, 128);
const POS = Object.fromEntries(FUNCTIONS.map((f, i) => [f.id, POSITIONS[i]])) as Record<FunctionId, { x: number; y: number }>;

// Every dependency named in the content, once per pair, so the diagram can only show relationships the text also explains.
const EDGES = (() => {
  const seen = new Set<string>();
  const out: { a: FunctionId; b: FunctionId }[] = [];
  for (const f of FUNCTIONS) {
    for (const r of f.ripples) {
      const key = [f.id, r.to].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ a: f.id, b: r.to });
    }
  }
  return out;
})();

const byId = (id: FunctionId) => FUNCTIONS.find((f) => f.id === id)!;

export default function OpportunityExplorer() {
  const [active, setActive] = useState<FunctionId>(FUNCTIONS[0].id);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const current = byId(active);
  const related = new Set(current.ripples.map((r) => r.to));

  const select = (id: FunctionId, focus = false) => {
    setActive(id);
    if (focus) tabRefs.current[id]?.focus();
  };

  // WAI-ARIA tabs: arrows move between tabs (and select them), Home and End jump to the ends.
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = FUNCTIONS.length - 1;
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (index === last ? 0 : index + 1)
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (index === 0 ? last : index - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    select(FUNCTIONS[next].id, true);
  };

  return (
    <div>
      <div role="tablist" aria-label="Business functions" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {FUNCTIONS.map((f, i) => {
          const Icon = ICONS[f.id];
          const selected = f.id === active;
          return (
            <button
              key={f.id}
              ref={(el) => {
                tabRefs.current[f.id] = el;
              }}
              type="button"
              role="tab"
              id={`bra-tab-${f.id}`}
              aria-selected={selected}
              aria-controls={`bra-panel-${f.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(f.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`flex min-h-[4.5rem] flex-col items-start justify-between gap-3 border px-4 py-3 text-left transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f] ${
                selected
                  ? "border-[#6b1f1f] bg-[#6b1f1f] text-[#f5f1ed]"
                  : "border-[#1a1816]/20 bg-white/60 text-[#1a1816] hover:border-[#6b1f1f]/60"
              }`}
            >
              <Icon aria-hidden="true" size={20} strokeWidth={1.4} />
              <span className="text-[13px] leading-snug">{f.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        {/* Diagram: a map of the functions and how they depend on each other. */}
        <figure className="m-0">
          <svg viewBox="0 0 420 390" width={420} height={390} className="h-auto w-full" aria-hidden="true" focusable="false" fill="none">
            <circle cx={CX} cy={CY} r={128} stroke={OXBLOOD} strokeOpacity={0.15} strokeDasharray="2 6" />
            {/* Spokes to the shared-information core */}
            {FUNCTIONS.map((f) => (
              <line
                key={`s-${f.id}`}
                x1={CX}
                y1={CY}
                x2={POS[f.id].x}
                y2={POS[f.id].y}
                stroke={OXBLOOD}
                strokeOpacity={f.id === active ? 0.5 : 0.12}
                className="transition-[stroke-opacity] duration-300 motion-reduce:transition-none"
              />
            ))}
            {/* Dependencies */}
            {EDGES.map(({ a, b }) => {
              const on = a === active || b === active;
              return (
                <line
                  key={`${a}-${b}`}
                  x1={POS[a].x}
                  y1={POS[a].y}
                  x2={POS[b].x}
                  y2={POS[b].y}
                  stroke={OXBLOOD}
                  strokeOpacity={on ? 0.9 : 0.16}
                  strokeWidth={on ? 1.8 : 1}
                  strokeLinecap="round"
                  className={`transition-[stroke-opacity] duration-300 motion-reduce:transition-none ${on ? "bra-flow" : ""}`}
                />
              );
            })}
            {/* Information core */}
            <rect x={CX - 26} y={CY - 26} width={52} height={52} rx={4} fill={IVORY} stroke={OXBLOOD} strokeOpacity={0.6} strokeWidth={1.4} />
            <path
              d={`M${CX - 12} ${CY - 10}H${CX + 12}M${CX - 12} ${CY}H${CX + 12}M${CX - 12} ${CY + 10}H${CX + 12}`}
              stroke={OXBLOOD}
              strokeOpacity={0.5}
            />
            <text x={CX} y={CY + 42} textAnchor="middle" fontSize={10} letterSpacing={2} fill={OXBLOOD} fillOpacity={0.9} stroke={IVORY} strokeWidth={4} strokeLinejoin="round" paintOrder="stroke" style={{ textTransform: "uppercase" }}>
              Shared information
            </text>
            {/* Functions */}
            {FUNCTIONS.map((f) => {
              const Icon = ICONS[f.id];
              const { x, y } = POS[f.id];
              const isActive = f.id === active;
              const isRelated = related.has(f.id);
              return (
                <g key={f.id} onClick={() => select(f.id)} className="cursor-pointer">
                  {isRelated && <circle cx={x} cy={y} r={NODE_R + 7} stroke={OXBLOOD} strokeOpacity={0.55} strokeDasharray="3 4" className="bra-bottleneck" />}
                  <circle
                    cx={x}
                    cy={y}
                    r={NODE_R}
                    fill={isActive ? OXBLOOD : IVORY}
                    stroke={OXBLOOD}
                    strokeOpacity={isActive || isRelated ? 1 : 0.4}
                    strokeWidth={1.5}
                    className="transition-colors duration-300 motion-reduce:transition-none"
                  />
                  <Icon x={x - 11} y={y - 11} size={22} strokeWidth={1.4} color={isActive ? IVORY : OXBLOOD} />
                  <text
                    x={x}
                    y={y + NODE_R + 21}
                    textAnchor="middle"
                    fontSize={12}
                    fill="#1a1816"
                    fillOpacity={isActive || isRelated ? 0.95 : 0.6}
                    fontWeight={isActive ? 600 : 400}
                  >
                    {f.short}
                  </text>
                </g>
              );
            })}
          </svg>
          <figcaption className="mt-2 text-xs leading-relaxed text-[#1a1816]/65">
            Select a function. Highlighted lines show the other functions it depends on or affects: the reason improvements are designed together.
          </figcaption>
        </figure>

        {/* Panels: all six are in the page (for readers and search engines); only the selected one is shown. */}
        <div>
          {FUNCTIONS.map((f) => (
            <div
              key={f.id}
              role="tabpanel"
              id={`bra-panel-${f.id}`}
              aria-labelledby={`bra-tab-${f.id}`}
              hidden={f.id !== active}
              tabIndex={0}
              className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6b1f1f]"
            >
              <h3 className="text-2xl font-light leading-snug tracking-tight md:text-3xl">{f.label}</h3>
              <dl className="mt-6 space-y-6">
                <div className="border-t border-[#1a1816]/20 pt-4">
                  <dt className="text-xs font-semibold uppercase tracking-[.2em] text-[#1a1816]/60">Today</dt>
                  <dd className="mt-2 text-base leading-relaxed text-[#1a1816]/85">{f.today}</dd>
                </div>
                <div className="border-t border-[#6b1f1f]/50 pt-4">
                  <dt className="text-xs font-semibold uppercase tracking-[.2em] text-[#6b1f1f]">What could change</dt>
                  <dd className="mt-2 text-base leading-relaxed text-[#1a1816]/90">{f.change}</dd>
                </div>
                <div className="border-t border-[#1a1816]/20 pt-4">
                  <dt className="text-xs font-semibold uppercase tracking-[.2em] text-[#1a1816]/60">Potential business benefit</dt>
                  <dd className="mt-2 text-base leading-relaxed text-[#1a1816]/85">{f.benefit}</dd>
                </div>
              </dl>

              <div className="mt-8 bg-white/70 p-5">
                <p className="text-sm font-medium text-[#1a1816]">Improving this on its own is rarely enough. It also touches:</p>
                <ul className="mt-3 space-y-3">
                  {f.ripples.map((r) => (
                    <li key={r.to} className="text-sm leading-relaxed text-[#1a1816]/80">
                      <button
                        type="button"
                        onClick={() => select(r.to, false)}
                        className="block font-semibold text-[#6b1f1f] underline underline-offset-4 decoration-[#6b1f1f]/40 hover:decoration-[#6b1f1f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]"
                        aria-label={`Show ${byId(r.to).label}`}
                      >
                        {byId(r.to).label}
                        <span aria-hidden="true" className="ml-1.5">&rarr;</span>
                      </button>
                      <span className="mt-0.5 block">{r.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
          <p className="mt-6 text-xs italic leading-relaxed text-[#1a1816]/65">{EXPLORER_DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}
