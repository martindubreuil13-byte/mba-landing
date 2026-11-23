"use client";

import { useState } from "react";
import { SYSTEM_NODES, type SystemNodeId } from "@/app/business-rearchitecture/content";
import { ringPoints, round } from "./geometry";

type Mode = "isolated" | "integrated";

const OXBLOOD = "#6b1f1f";
const IVORY = "#f5f1ed";
const CX = 280;
const CY = 220;
const R = 150;
const NODE_R = 22;
const POINTS = ringPoints(SYSTEM_NODES.length, CX, CY, R);
const LABELS = ringPoints(SYSTEM_NODES.length, CX, CY, R + 40);

/** A short line between two circles, trimmed so it starts and ends at their edges. */
function trimmed(a: { x: number; y: number }, b: { x: number; y: number }, ra: number, rb: number) {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const ux = (b.x - a.x) / d;
  const uy = (b.y - a.y) / d;
  return { x1: round(a.x + ux * ra), y1: round(a.y + uy * ra), x2: round(b.x - ux * rb), y2: round(b.y - uy * rb) };
}

/**
 * Isolated optimisation versus integrated architecture, on the same seven functions.
 * Pick a function to "improve". Designed alone, the load lands on the next function in the chain and a new bottleneck appears.
 * Designed together, the change is planned across the shared information every function relies on.
 */
export default function WholeBusiness() {
  const [mode, setMode] = useState<Mode>("isolated");
  const [picked, setPicked] = useState<SystemNodeId>("sales");
  const index = SYSTEM_NODES.findIndex((n) => n.id === picked);
  const node = SYSTEM_NODES[index];
  const nextIndex = (index + 1) % SYSTEM_NODES.length;
  const integrated = mode === "integrated";

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,6fr)] lg:gap-14">
      <figure className="m-0">
        <svg viewBox="0 0 560 440" width={560} height={440} className="h-auto w-full" aria-hidden="true" focusable="false" fill="none">
          <circle cx={CX} cy={CY} r={R} stroke={OXBLOOD} strokeOpacity={0.14} strokeDasharray="2 6" />

          {/* The ring: how work passes from one function to the next. */}
          {POINTS.map((p, i) => {
            const q = POINTS[(i + 1) % POINTS.length];
            const l = trimmed(p, q, NODE_R, NODE_R);
            const isPushed = !integrated && i === index;
            return (
              <line
                key={`ring-${SYSTEM_NODES[i].id}`}
                {...l}
                stroke={OXBLOOD}
                strokeOpacity={integrated ? 0.7 : isPushed ? 0.9 : 0.25}
                strokeWidth={isPushed ? 2.4 : 1.2}
                strokeLinecap="round"
                className="transition-[stroke-opacity,stroke-width] duration-300 motion-reduce:transition-none"
              />
            );
          })}

          {/* Shared information: connected to everything when integrated, absent when each function works alone. */}
          {POINTS.map((p, i) => {
            const l = trimmed({ x: CX, y: CY }, p, 30, NODE_R);
            return (
              <line
                key={`spoke-${SYSTEM_NODES[i].id}`}
                {...l}
                stroke={OXBLOOD}
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeOpacity={integrated ? 0.85 : 0}
                className={`transition-[stroke-opacity] duration-500 motion-reduce:transition-none ${integrated ? "bra-flow" : ""}`}
              />
            );
          })}
          <rect
            x={CX - 30}
            y={CY - 30}
            width={60}
            height={60}
            rx={4}
            fill={integrated ? OXBLOOD : IVORY}
            stroke={OXBLOOD}
            strokeOpacity={integrated ? 1 : 0.3}
            strokeDasharray={integrated ? undefined : "3 4"}
            className="transition-colors duration-500 motion-reduce:transition-none"
          />
          <path
            d={`M${CX - 14} ${CY - 11}H${CX + 14}M${CX - 14} ${CY}H${CX + 14}M${CX - 14} ${CY + 11}H${CX + 14}`}
            stroke={integrated ? IVORY : OXBLOOD}
            strokeOpacity={integrated ? 0.9 : 0.3}
          />
          <text x={CX} y={CY + 50} textAnchor="middle" fontSize={10} letterSpacing={2} fill={OXBLOOD} fillOpacity={integrated ? 0.9 : 0.5} stroke={IVORY} strokeWidth={4} strokeLinejoin="round" paintOrder="stroke" style={{ textTransform: "uppercase" }}>
            Information
          </text>

          {/* Bottleneck marker on the function that inherits the load. */}
          {!integrated && (
            <g>
              <circle cx={POINTS[nextIndex].x} cy={POINTS[nextIndex].y} r={NODE_R + 8} stroke={OXBLOOD} strokeWidth={1.6} strokeDasharray="4 4" className="bra-bottleneck" />
            </g>
          )}

          {/* Functions */}
          {SYSTEM_NODES.map((n, i) => {
            const p = POINTS[i];
            const isPicked = i === index;
            const isNext = !integrated && i === nextIndex;
            return (
              <g key={n.id} onClick={() => setPicked(n.id)} className="cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={NODE_R}
                  fill={isPicked ? OXBLOOD : IVORY}
                  stroke={OXBLOOD}
                  strokeOpacity={isPicked || isNext || integrated ? 1 : 0.45}
                  strokeWidth={1.5}
                  className="transition-colors duration-300 motion-reduce:transition-none"
                />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill={isPicked ? IVORY : OXBLOOD}>
                  {i + 1}
                </text>
                <text
                  x={LABELS[i].x}
                  y={LABELS[i].y + 4}
                  textAnchor={Math.abs(LABELS[i].x - CX) < 10 ? "middle" : LABELS[i].x > CX ? "start" : "end"}
                  fontSize={16}
                  fill="#1a1816"
                  fillOpacity={isPicked || isNext ? 0.95 : 0.65}
                  fontWeight={isPicked ? 600 : 400}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
        <figcaption className="mt-2 text-xs leading-relaxed text-[#1a1816]/65">
          Illustrative. The ring shows how work passes from one function to the next; the core is the information they all rely on.
          {!integrated && (
            <span className="mt-1 flex items-center gap-2 text-[#6b1f1f]">
              <svg aria-hidden="true" viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="3 2.5">
                <circle cx={8} cy={8} r={6.5} />
              </svg>
              New bottleneck: where the extra load lands
            </span>
          )}
        </figcaption>
      </figure>

      <div>
        <div role="group" aria-label="Approach" className="inline-flex w-full border border-[#1a1816]/25 sm:w-auto">
          {(["isolated", "integrated"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`min-h-11 flex-1 px-4 py-2 text-sm transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f] sm:flex-none sm:px-5 ${
                mode === m ? "bg-[#6b1f1f] text-[#f5f1ed]" : "bg-white/60 text-[#1a1816] hover:bg-white"
              }`}
            >
              {m === "isolated" ? "Optimize one department" : "Design the whole business"}
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-[#1a1816]/60">Improve</p>
        <div role="group" aria-label="Function to improve" className="mt-2 flex flex-wrap gap-2">
          {SYSTEM_NODES.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-pressed={picked === n.id}
              onClick={() => setPicked(n.id)}
              className={`min-h-11 border px-3.5 py-2 text-sm transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f] ${
                picked === n.id ? "border-[#6b1f1f] bg-[#6b1f1f]/10 font-medium text-[#6b1f1f]" : "border-[#1a1816]/20 bg-white/60 hover:border-[#6b1f1f]/60"
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>

        <div className="mt-8 border-t border-[#6b1f1f]/50 pt-5" aria-live="polite">
          <h3 className="text-sm font-semibold uppercase tracking-[.2em] text-[#6b1f1f]">
            {integrated ? "Designed together" : `Optimized alone: the pressure moves to ${SYSTEM_NODES[nextIndex].label}`}
          </h3>
          <p className="mt-3 text-lg font-light leading-relaxed text-[#1a1816]">{integrated ? node.integrated : node.isolated}</p>
        </div>
      </div>
    </div>
  );
}
