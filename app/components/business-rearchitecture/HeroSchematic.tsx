import { SYSTEM_NODES } from "@/app/business-rearchitecture/content";
import { ringPoints, round } from "./geometry";

const W = 560;
const H = 520;
const CX = 280;
const CY = 260;
const R = 150;

/**
 * The hero figure: the business drawn as an architectural plan. Seven functions sit on a ring around a shared information core,
 * linked by thin lines along which information slowly travels. Decorative (aria-hidden); the same relationships are described
 * in words in the sections below. A server component: it ships no JavaScript.
 */
export default function HeroSchematic() {
  const nodes = ringPoints(SYSTEM_NODES.length, CX, CY, R);
  const labels = ringPoints(SYSTEM_NODES.length, CX, CY, R + 30);
  const ticks: string[] = [];
  for (let d = -225; d <= 225; d += 25) {
    const long = d % 75 === 0 ? 8 : 4;
    ticks.push(`M${CX + d} ${CY - long}V${CY + long}`, `M${CX - long} ${CY + d}H${CX + long}`);
  }
  const ringPath = nodes.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join("") + "Z";
  const chords = nodes.map((p, i) => {
    const q = nodes[(i + 3) % nodes.length];
    return `M${p.x} ${p.y}L${q.x} ${q.y}`;
  });

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        width={W}
        height={H}
        aria-hidden="true"
        focusable="false"
        fill="none"
        stroke="#6b1f1f"
      >
        {/* Plan geometry: concentric zones, axes and dimension ticks */}
        <circle cx={CX} cy={CY} r={225} strokeOpacity={0.2} strokeDasharray="2 6" />
        <circle cx={CX} cy={CY} r={R} strokeOpacity={0.3} />
        <circle cx={CX} cy={CY} r={78} strokeOpacity={0.22} />
        <path d={`M${CX - 235} ${CY}H${CX + 235}M${CX} ${CY - 235}V${CY + 235}`} strokeOpacity={0.14} />
        <path d={ticks.join("")} strokeOpacity={0.3} />

        {/* Dependencies between functions */}
        <path d={chords.join("")} strokeOpacity={0.14} />
        <path d={ringPath} strokeOpacity={0.35} />

        {/* Spokes to the information core, with a slow flow of information along each */}
        {nodes.map((p, i) => (
          <g key={SYSTEM_NODES[i].id}>
            <path d={`M${p.x} ${p.y}L${CX} ${CY}`} strokeOpacity={0.3} />
            <path
              d={`M${p.x} ${p.y}L${CX} ${CY}`}
              strokeOpacity={0.85}
              strokeWidth={1.6}
              strokeLinecap="round"
              className={i % 2 ? "bra-flow bra-flow-slow" : "bra-flow"}
            />
          </g>
        ))}

        {/* The information core */}
        <circle cx={CX} cy={CY} r={44} fill="#6b1f1f" fillOpacity={0.07} stroke="none" className="bra-hub-pulse" />
        <rect x={CX - 28} y={CY - 28} width={56} height={56} rx={4} fill="#f5f1ed" strokeWidth={1.5} />
        <path d={`M${CX - 14} ${CY - 6}H${CX + 14}M${CX - 14} ${CY + 6}H${CX + 14}M${CX - 14} ${CY - 18}H${CX + 14}`} strokeOpacity={0.55} />

        {/* The functions */}
        {nodes.map((p, i) => (
          <circle key={SYSTEM_NODES[i].id} cx={p.x} cy={p.y} r={9} fill="#f5f1ed" strokeWidth={1.6} />
        ))}

        {/* Labels are legible from tablet width up; on a phone the figure is a drawing, and the Explorer below carries the words. */}
        <g className="hidden sm:inline" fill="#1a1816" stroke="none" fontSize={13} letterSpacing={2.2} style={{ textTransform: "uppercase" }}>
          {labels.map((p, i) => {
            const dx = p.x - CX;
            const anchor = Math.abs(dx) < 12 ? "middle" : dx > 0 ? "start" : "end";
            const y = round(p.y + (p.y < CY - 100 ? -4 : p.y > CY + 100 ? 16 : 5));
            const x = round(p.x + (anchor === "start" ? 2 : anchor === "end" ? -2 : 0));
            return (
              <text key={SYSTEM_NODES[i].id} x={x} y={y} textAnchor={anchor} fillOpacity={0.75}>
                {SYSTEM_NODES[i].label}
              </text>
            );
          })}
          <text x={CX} y={CY + 52} textAnchor="middle" fill="#6b1f1f" stroke="#f5f1ed" strokeWidth={5} strokeLinejoin="round" paintOrder="stroke">
            Information
          </text>
        </g>
      </svg>
      <figcaption className="mt-3 text-xs tracking-wide text-[#1a1816]/65">
        Fig. 1 &mdash; A business as a connected system: every function depends on shared information and on the others.
      </figcaption>
    </figure>
  );
}
