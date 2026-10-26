import Link from "next/link";
import AdminShell from "@/app/components/admin/AdminShell";
import { PRESET_LABELS, RANGE_PRESETS, isoDay, type ResolvedRange } from "@/app/lib/intelligence/ranges";

const TABS = [
  { key: "overview", label: "Overview", href: "/admin/intelligence" },
  { key: "traffic", label: "Traffic", href: "/admin/intelligence/traffic" },
  { key: "content", label: "Content", href: "/admin/intelligence/content" },
  { key: "journeys", label: "Journeys", href: "/admin/intelligence/journeys" },
  { key: "conversions", label: "Conversions", href: "/admin/intelligence/conversions" },
  { key: "ai", label: "AI Visibility", href: "/admin/intelligence/ai-visibility" },
] as const;
export type IntelligenceTab = (typeof TABS)[number]["key"];

/** Shared chrome for every Website Intelligence view: title, view tabs, date range, collection status. */
export default function IntelligenceFrame({
  active,
  range,
  collectionStart,
  children,
}: {
  active: IntelligenceTab;
  range: ResolvedRange;
  collectionStart: string | null;
  children: React.ReactNode;
}) {
  const base = TABS.find((t) => t.key === active)!.href;
  return (
    <AdminShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-[#6b1f1f]">Website Intelligence</p>
        <h1 className="mt-2 text-3xl font-light">{TABS.find((t) => t.key === active)!.label}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#1a1816]/60">
          First-party, cookieless measurement of this website. Counts are anonymous per-tab sessions, not people, and all days are UTC.{" "}
          {collectionStart ? `Collection began ${isoDay(new Date(collectionStart))}.` : "No data has been collected yet."}
        </p>
      </div>

      <nav aria-label="Website Intelligence views" className="mb-6 flex flex-wrap gap-x-6 gap-y-2 border-b border-[#1a1816]/10">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={t.key === active ? "page" : undefined}
            className={`-mb-px border-b-2 pb-3 text-sm tracking-wide ${
              t.key === active ? "border-[#6b1f1f] font-semibold text-[#6b1f1f]" : "border-transparent text-[#1a1816]/60 hover:text-[#1a1816]"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
          {RANGE_PRESETS.map((p) => (
            <Link
              key={p}
              href={`${base}?range=${p}`}
              aria-current={range.key === p ? "true" : undefined}
              className={`border px-3 py-2 text-xs uppercase tracking-widest ${
                range.key === p ? "border-[#6b1f1f] bg-[#6b1f1f] text-white" : "border-[#1a1816]/15 bg-white text-[#1a1816]/70 hover:border-[#1a1816]/40"
              }`}
            >
              {PRESET_LABELS[p]}
            </Link>
          ))}
        </div>
        <form action={base} className="flex flex-wrap items-end gap-2 text-sm">
          <label className="text-xs uppercase tracking-widest text-[#1a1816]/50">
            From
            <input type="date" name="from" defaultValue={range.key === "custom" ? isoDay(range.from) : ""} required className="mt-1 block border border-[#1a1816]/15 bg-white px-2 py-2 text-sm normal-case tracking-normal" />
          </label>
          <label className="text-xs uppercase tracking-widest text-[#1a1816]/50">
            To
            <input type="date" name="to" defaultValue={range.key === "custom" ? isoDay(new Date(range.to.getTime() - 86_400_000)) : ""} required className="mt-1 block border border-[#1a1816]/15 bg-white px-2 py-2 text-sm normal-case tracking-normal" />
          </label>
          <button className={`border px-3 py-2 text-xs uppercase tracking-widest ${range.key === "custom" ? "border-[#6b1f1f] bg-[#6b1f1f] text-white" : "border-[#1a1816]/15 bg-white hover:border-[#1a1816]/40"}`}>
            Custom
          </button>
        </form>
      </div>

      <p className="mb-6 text-xs text-[#1a1816]/50">
        Showing <strong className="font-semibold text-[#1a1816]/70">{range.label}</strong> ({isoDay(range.from)} to {isoDay(new Date(range.to.getTime() - 86_400_000))}), compared with the preceding {range.days}{" "}
        {range.days === 1 ? "day" : "days"}.{range.includesToday ? " The current day is still in progress, so recent comparisons run low." : ""}
      </p>
      {children}
    </AdminShell>
  );
}
