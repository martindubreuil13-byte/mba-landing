"use client";

import { useState } from "react";
import Link from "next/link";
import type { ExperienceInsights } from "@/app/lib/leads/experience-insights";

type Tab = "all" | "napkin" | "reality_check";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-[#1a1816]/10 bg-white px-4 py-3">
      <p className="text-xl font-light">{value}</p>
      <p className="text-[11px] uppercase tracking-widest text-[#1a1816]/50 mt-1">{label}</p>
    </div>
  );
}

function BucketList({ title, buckets }: { title: string; buckets: { key: string; label: string; count: number }[] }) {
  if (buckets.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-[#1a1816]/45 mb-2">{title}</p>
      <ul className="space-y-1">
        {buckets.slice(0, 6).map((b) => (
          <li key={b.key} className="flex items-center justify-between text-sm">
            <span className="text-[#1a1816]/75">{b.label}</span>
            <span className="text-[#1a1816]/50">{b.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const dateFmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function ExperiencesPanel({ insights }: { insights: ExperienceInsights }) {
  const [tab, setTab] = useState<Tab>("all");

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(["all", "napkin", "reality_check"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs tracking-widest uppercase px-3 py-2 border ${
              tab === t ? "border-[#6b1f1f] text-[#6b1f1f] bg-[#6b1f1f]/5" : "border-[#1a1816]/15 text-[#1a1816]/60 hover:border-[#1a1816]/30"
            }`}
          >
            {t === "all" ? "All experiences" : t === "napkin" ? "Napkin Principle" : "Reality Check"}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <Stat label="Total completions" value={insights.combined.totalCompletions} />
            <Stat label="Napkin Principle" value={insights.napkin.completed} />
            <Stat label="Reality Check" value={insights.realityCheck.completed} />
          </div>
          <p className="text-[11px] uppercase tracking-widest text-[#1a1816]/45 mb-2">Recent submissions</p>
          {insights.combined.recent.length === 0 ? (
            <p className="text-sm text-[#1a1816]/50">Nothing yet.</p>
          ) : (
            <ul className="divide-y divide-[#1a1816]/8">
              {insights.combined.recent.map((item) => (
                <li key={`${item.type}-${item.id}`} className="py-2 flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <Link href={item.href} className="text-[#6b1f1f] hover:underline">
                      {item.label}
                    </Link>
                    <span className="text-[#1a1816]/40 ml-2 text-xs uppercase tracking-widest">
                      {item.type === "napkin" ? "Napkin" : "Reality Check"}
                    </span>
                  </div>
                  <span className="text-[#1a1816]/50 whitespace-nowrap text-xs">{dateFmt(item.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "napkin" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat label="Completed" value={insights.napkin.completed} />
            <Stat label="Joined community" value={insights.napkin.communityJoined} />
            <Stat label="Currently subscribed" value={insights.napkin.subscribed} />
            <Stat label="Declined" value={insights.napkin.completed - insights.napkin.communityJoined} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
            <BucketList title="Result categories" buckets={insights.napkin.categories} />
            <BucketList title="Countries (where known)" buckets={insights.napkin.countries} />
          </div>
          <p className="text-[11px] uppercase tracking-widest text-[#1a1816]/45 mb-2">Recent submissions</p>
          <ul className="divide-y divide-[#1a1816]/8 mb-4">
            {insights.napkin.recent.map((item) => (
              <li key={item.id} className="py-2 flex items-center justify-between gap-4 text-sm">
                <Link href={item.href} className="text-[#6b1f1f] hover:underline min-w-0 truncate">
                  {item.label}
                </Link>
                <span className="text-[#1a1816]/50 whitespace-nowrap text-xs">{item.detail} · {dateFmt(item.at)}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/napkin" className="text-xs uppercase tracking-widest text-[#6b1f1f] underline">
            View all Napkin Principle submissions →
          </Link>
        </div>
      )}

      {tab === "reality_check" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <Stat label="Completed" value={insights.realityCheck.completed} />
            <Stat label="Average score" value={insights.realityCheck.avgScore ?? "—"} />
            <Stat label="Bands represented" value={insights.realityCheck.bands.length} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
            <BucketList title="Score bands" buckets={insights.realityCheck.bands} />
            <BucketList title="Countries (where known)" buckets={insights.realityCheck.countries} />
          </div>
          <p className="text-[11px] uppercase tracking-widest text-[#1a1816]/45 mb-2">Recent submissions</p>
          <ul className="divide-y divide-[#1a1816]/8 mb-4">
            {insights.realityCheck.recent.map((item) => (
              <li key={item.id} className="py-2 flex items-center justify-between gap-4 text-sm">
                <Link href={item.href} className="text-[#6b1f1f] hover:underline min-w-0 truncate">
                  {item.label}
                </Link>
                <span className="text-[#1a1816]/50 whitespace-nowrap text-xs">{item.detail} · {dateFmt(item.at)}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/assessments" className="text-xs uppercase tracking-widest text-[#6b1f1f] underline">
            View all Reality Check submissions →
          </Link>
        </div>
      )}
    </div>
  );
}
