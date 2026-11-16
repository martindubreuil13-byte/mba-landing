import { ReportCaption } from "./EditorialReport";

/** A metric deliberately not reported, with the reason. Shown instead of a number we cannot stand behind. */
export function NotMeasured({ label, reason }: { label: string; reason: string }) {
  return (
    <div className="border-t border-dashed border-[#b19d90] pt-4">
      <p className="text-xs uppercase tracking-widest text-[#5a5049]">{label}</p>
      <p className="mt-2 text-lg font-light text-[#1a1816]/60">Not measured</p>
      <p className="mt-2 text-[11px] leading-snug text-[#5a5049]">{reason}</p>
    </div>
  );
}

export function Panel({ title, note, children, nested = false }: { title: string; note?: string; children: React.ReactNode; nested?: boolean }) {
  const Heading = nested ? "h3" : "h2";
  return (
    <section className="min-w-0 border-t border-[#b19d90] bg-[#faf5eb] px-4 py-5 text-[#1a1816] sm:px-6">
      <Heading className="mb-2 font-serif text-2xl tracking-tight">{title}</Heading>
      {note ? <ReportCaption>{note}</ReportCaption> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="border border-dashed border-[#1a1816]/15 px-4 py-6 text-sm text-[#5a5049]">{children}</p>;
}

/** Horizontal bars with a count and share. Rows are already sorted by the query. */
export function BarList({ rows, total, label, wrap = false }: { rows: { key: string; value: number; sub?: string }[]; total: number; label?: (k: string) => string; wrap?: boolean }) {
  if (!rows.length) return <Empty>No data in this range.</Empty>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className={wrap ? "min-w-0 [overflow-wrap:anywhere]" : "min-w-0 truncate"} title={r.key}>{label ? label(r.key) : r.key}</span>
            <span className="shrink-0 tabular-nums text-[#1a1816]/70">
              {r.value} <span className="text-[#5a5049]">· {total > 0 ? `${((r.value / total) * 100).toFixed(0)}%` : "Share unavailable"}</span>
            </span>
          </div>
          <ComparisonBar value={r.value} max={max} />
          {r.sub ? <p className="mt-1 text-xs text-[#5a5049]">{r.sub}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export function ReportTable({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className="min-w-0 max-h-[32rem] overflow-auto focus-visible:outline-2 focus-visible:outline-[#6b1f1f]">
      {children}
    </div>
  );
}

export function ComparisonBar({ value, max }: { value: number; max: number }) {
  return (
    <div aria-hidden="true" className="mt-1 h-1.5 bg-[#e6dbce]">
      <div className="h-full bg-[#6b1f1f]" style={{ width: `${max > 0 ? value / max * 100 : 0}%` }} />
    </div>
  );
}

/** Exact daily values accompany the visual scale. */
export function DayBars({ points, label }: { points: { day: string; n: number }[]; label: string }) {
  if (!points.length) return <Empty>No daily observations in this range.</Empty>;
  const max = Math.max(0, ...points.map((p) => p.n));
  return (
    <figure className="space-y-3">
      <figcaption><ReportCaption>{max > 0 ? `Daily peak: ${max}. Scale starts at zero.` : "Zero across recorded days."}</ReportCaption></figcaption>
      <svg aria-hidden="true" className="block h-24 w-full border-b border-[#b19d90] bg-[#f1e7d8]" viewBox={`0 0 ${points.length} 100`} preserveAspectRatio="none">
        {max > 0 && points.map((point, index) => (
          <rect key={point.day} x={index + 0.1} y={100 - point.n / max * 100} width={0.8} height={point.n / max * 100} fill="#6b1f1f" />
        ))}
      </svg>
      <div aria-hidden="true" className="flex justify-between text-xs text-[#5a5049]"><span>{points[0].day}</span>{points.length > 1 && <span>{points.at(-1)?.day}</span>}</div>
      <details>
        <summary className="cursor-pointer py-2 font-semibold text-[#6b1f1f] underline focus-visible:outline-2">Daily values table</summary>
        <ReportTable label={`${label}, exact daily values`}>
          <table className="w-full text-left text-sm tabular-nums">
            <caption className="sr-only">{label} by day in UTC</caption>
            <thead><tr><th scope="col" className="p-2">Day (UTC)</th><th scope="col" className="p-2 text-right">{label}</th></tr></thead>
            <tbody>{points.map((p) => <tr key={p.day} className="border-t border-[#d7c8bb]"><th scope="row" className="p-2 font-normal">{p.day}</th><td className="p-2 text-right">{p.n}</td></tr>)}</tbody>
          </table>
        </ReportTable>
      </details>
    </figure>
  );
}
