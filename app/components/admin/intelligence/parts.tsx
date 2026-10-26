import { percentChange } from "@/app/lib/intelligence/ranges";

export function Stat({
  label,
  value,
  current,
  previous,
  definition,
}: {
  label: string;
  value: string;
  /** Numeric values used for the comparison; omit to show no delta. */
  current?: number;
  previous?: number;
  definition: string;
}) {
  const change = current !== undefined && previous !== undefined ? percentChange(current, previous) : null;
  return (
    <div className="border border-[#1a1816]/10 bg-white px-5 py-4">
      <p className="text-xs uppercase tracking-widest text-[#1a1816]/50">{label}</p>
      <p className="mt-2 text-3xl font-light tabular-nums">{value}</p>
      <p className="mt-1 h-4 text-xs tabular-nums text-[#1a1816]/50">
        {change === null ? (previous === undefined ? "" : "no previous data") : (
          <span className={change > 0 ? "text-[#1a1816]" : change < 0 ? "text-[#6b1f1f]" : ""}>
            {change > 0 ? "▲" : change < 0 ? "▼" : "•"} {Math.abs(change).toFixed(0)}% <span className="text-[#1a1816]/40">vs previous</span>
          </span>
        )}
      </p>
      <p className="mt-2 text-[11px] leading-snug text-[#1a1816]/45">{definition}</p>
    </div>
  );
}

/** A metric deliberately not reported, with the reason. Shown instead of a number we cannot stand behind. */
export function NotMeasured({ label, reason }: { label: string; reason: string }) {
  return (
    <div className="border border-dashed border-[#1a1816]/20 bg-white/50 px-5 py-4">
      <p className="text-xs uppercase tracking-widest text-[#1a1816]/50">{label}</p>
      <p className="mt-2 text-lg font-light text-[#1a1816]/60">Not measured</p>
      <p className="mt-2 text-[11px] leading-snug text-[#1a1816]/45">{reason}</p>
    </div>
  );
}

export function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="border border-[#1a1816]/10 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-[#1a1816]/70">{title}</h2>
      {note ? <p className="mt-1 text-xs text-[#1a1816]/45">{note}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="border border-dashed border-[#1a1816]/15 px-4 py-6 text-sm text-[#1a1816]/50">{children}</p>;
}

/** Horizontal bars with a count and share. Rows are already sorted by the query. */
export function BarList({ rows, total, label }: { rows: { key: string; value: number; sub?: string }[]; total: number; label?: (k: string) => string }) {
  if (!rows.length) return <Empty>No data in this range.</Empty>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate" title={r.key}>{label ? label(r.key) : r.key}</span>
            <span className="shrink-0 tabular-nums text-[#1a1816]/70">
              {r.value} <span className="text-[#1a1816]/40">· {total > 0 ? ((r.value / total) * 100).toFixed(0) : 0}%</span>
            </span>
          </div>
          <div className="mt-1 h-1.5 bg-[#1a1816]/[0.07]" aria-hidden>
            <div className="h-full bg-[#6b1f1f]" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          {r.sub ? <p className="mt-1 text-xs text-[#1a1816]/45">{r.sub}</p> : null}
        </li>
      ))}
    </ul>
  );
}

/** Small server-rendered daily bar chart for a single count per day. */
export function DayBars({ points, label }: { points: { day: string; n: number }[]; label: string }) {
  const max = Math.max(1, ...points.map((p) => p.n));
  const total = points.reduce((a, p) => a + p.n, 0);
  return (
    <div>
      <div className="flex h-24 items-end gap-px" role="img" aria-label={`${label}: ${total} in ${points.length} days`}>
        {points.map((p) => (
          <div key={p.day} className="flex h-full min-w-px flex-1 items-end" title={`${p.day}: ${p.n}`}>
            <div className="w-full bg-[#6b1f1f]" style={{ height: `${p.n ? Math.max(6, (p.n / max) * 100) : 0}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-[#1a1816]/45"><span>{points[0]?.day.slice(5)}</span><span>{points.at(-1)?.day.slice(5)}</span></div>
    </div>
  );
}
