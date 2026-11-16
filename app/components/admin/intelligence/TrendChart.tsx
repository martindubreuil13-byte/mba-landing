import type { TrendPoint } from "@/app/lib/intelligence/reports";
import { ReportCaption } from "./EditorialReport";

const series = [
  { key: "sessions", label: "Sessions" },
  { key: "pageviews", label: "Page views" },
  { key: "ai_sessions", label: "AI referral sessions" },
  { key: "conversions", label: "Confirmed conversions" },
] as const;

export default function TrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) return <ReportCaption>No daily observations in this range.</ReportCaption>;
  return (
    <figure className="space-y-4">
      <figcaption><ReportCaption>Each row has its own scale starting at zero. Compare timing across rows and use the daily values for exact counts. Dates are UTC.</ReportCaption></figcaption>
      <div aria-hidden="true" className="space-y-4">
        {series.map(({ key, label }) => {
          const peak = Math.max(...points.map((point) => point[key]));
          return (
            <div key={key}>
              <div className="mb-1 flex flex-wrap justify-between gap-x-3 text-sm">
                <span className="font-semibold">{label}</span>
                <span className="tabular-nums text-[#5a5049]">{peak > 0 ? `Daily peak · ${peak}` : "0 across recorded days"}</span>
              </div>
              <svg className="block h-12 w-full border-b border-[#b19d90] bg-[#f1e7d8]" viewBox={`0 0 ${points.length} 100`} preserveAspectRatio="none">
                {peak > 0 && points.map((point, index) => (
                  <rect key={point.day} x={index + 0.1} y={100 - point[key] / peak * 100} width={0.8} height={point[key] / peak * 100} fill="#6b1f1f" />
                ))}
              </svg>
            </div>
          );
        })}
        <div className="flex justify-between gap-2 text-xs tabular-nums text-[#5a5049]">
          <span>{points[0].day}</span>
          {points.length > 1 && <span>{points.at(-1)?.day}</span>}
        </div>
      </div>
      <details>
        <summary className="w-fit cursor-pointer py-2 font-semibold text-[#6b1f1f] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">Daily values table</summary>
        <div role="region" aria-label="Scrollable daily values" tabIndex={0} className="max-h-72 overflow-auto focus-visible:outline-2">
          <table className="w-full border-collapse text-left text-sm tabular-nums">
            <caption className="sr-only">Daily Website Intelligence values in UTC</caption>
            <thead><tr><th scope="col" className="p-2">Day (UTC)</th>{series.map(({ key, label }) => <th key={key} scope="col" className="p-2 text-right">{label}</th>)}</tr></thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.day} className="border-t border-[#d7c8bb]">
                  <th scope="row" className="whitespace-nowrap p-2 font-normal">{point.day}</th>
                  {series.map(({ key }) => <td key={key} className="p-2 text-right">{point[key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
