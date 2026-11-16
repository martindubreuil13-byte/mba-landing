import type { ReactNode } from "react";
import { percentChange } from "@/app/lib/intelligence/ranges";

export function ReportCaption({ children }: { children: ReactNode }) {
  return <p className="max-w-prose text-sm leading-relaxed text-[#5a5049]">{children}</p>;
}

export function ReportSection({ title, caption, children }: { title: string; caption?: string; children: ReactNode }) {
  return (
    <section className="min-w-0 border-t border-[#b19d90] pt-5">
      <h2 className="mb-2 font-serif text-3xl tracking-tight">{title}</h2>
      {caption && <ReportCaption>{caption}</ReportCaption>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function MetricSummary({ label, value, current, previous, children }: {
  label: string;
  value: string;
  current?: number;
  previous?: number;
  children: ReactNode;
}) {
  const change = current !== undefined && previous !== undefined ? percentChange(current, previous) : null;
  const direction = change === null ? null : change > 0 ? "up" : change < 0 ? "down" : "unchanged";
  return (
    <div className="min-w-0 border-t border-[#b19d90] pt-3">
      <dt className="text-sm font-semibold">{label}</dt>
      <dd className="my-1 font-serif text-4xl tabular-nums text-[#6b1f1f]">{value === "—" ? <abbr title="Unavailable">—</abbr> : value}</dd>
      {(current !== undefined || previous !== undefined) && <dd className="text-sm text-[#5a5049]">
        {change === null ? "No comparable previous value" : direction === "unchanged" ? "Unchanged vs previous period" : `${Math.abs(change).toFixed(0)}% ${direction} vs previous period`}
      </dd>}
      <dd className="mt-2"><ReportCaption>{children}</ReportCaption></dd>
    </div>
  );
}
