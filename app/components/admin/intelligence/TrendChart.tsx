import type { TrendPoint } from "@/app/lib/intelligence/reports";

/**
 * Server-rendered SVG: bars = sessions, line = page views, one shared scale. No chart library, no client JS.
 * The same numbers are available as a table underneath for accessibility.
 */
export default function TrendChart({ points }: { points: TrendPoint[] }) {
  const W = 720;
  const H = 220;
  const pad = { l: 36, r: 8, t: 10, b: 24 };
  const max = Math.max(1, ...points.map((p) => Math.max(p.sessions, p.pageviews)));
  const niceMax = max <= 4 ? max : Math.ceil(max / 4) * 4;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const slot = innerW / Math.max(points.length, 1);
  const barW = Math.max(1, Math.min(28, slot * 0.6));
  const x = (i: number) => pad.l + slot * i + slot / 2;
  const y = (v: number) => pad.t + innerH - (v / niceMax) * innerH;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.pageviews).toFixed(1)}`).join(" ");
  const ticks = [0, 0.5, 1].map((f) => Math.round(niceMax * f));
  const labelAt = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);
  const total = points.reduce((a, p) => a + p.sessions, 0);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Daily sessions and page views, ${points.length} days, ${total} sessions in total`} className="h-auto w-full">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#1a1816" strokeOpacity={0.08} />
            <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill="#1a1816" fillOpacity={0.5}>{t}</text>
          </g>
        ))}
        {points.map((p, i) => (
          <g key={p.day}>
            <rect x={x(i) - barW / 2} y={y(p.sessions)} width={barW} height={Math.max(0, pad.t + innerH - y(p.sessions))} fill="#6b1f1f" fillOpacity={0.85}>
              <title>{`${p.day}: ${p.sessions} sessions, ${p.pageviews} page views`}</title>
            </rect>
            {labelAt.has(i) ? (
              <text x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} fontSize="10" fill="#1a1816" fillOpacity={0.5}>{p.day.slice(5)}</text>
            ) : null}
          </g>
        ))}
        {points.length > 1 ? <path d={line} fill="none" stroke="#1a1816" strokeWidth={1.5} /> : null}
        {points.length === 1 ? <circle cx={x(0)} cy={y(points[0].pageviews)} r={3} fill="#1a1816" /> : null}
      </svg>
      <div className="mt-2 flex gap-5 text-xs text-[#1a1816]/60">
        <span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 bg-[#6b1f1f]" />Sessions</span>
        <span className="flex items-center gap-2"><span className="inline-block h-0.5 w-4 bg-[#1a1816]" />Page views</span>
      </div>
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer select-none uppercase tracking-widest text-[#1a1816]/50">Data table</summary>
        <div className="mt-2 max-h-64 overflow-auto">
          <table className="w-full text-left tabular-nums">
            <thead className="text-[#1a1816]/50"><tr><th className="py-1 pr-4 font-normal">Day (UTC)</th><th className="pr-4 font-normal">Sessions</th><th className="font-normal">Page views</th></tr></thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.day} className="border-t border-[#1a1816]/5"><td className="py-1 pr-4">{p.day}</td><td className="pr-4">{p.sessions}</td><td>{p.pageviews}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
