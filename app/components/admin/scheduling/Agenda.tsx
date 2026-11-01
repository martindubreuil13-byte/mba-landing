"use client";
import Link from "next/link";
import { useBookingDrawer } from "./BookingDrawer";
import { useAdminBase } from "./AdminContext";
import { btnQuiet, eyebrow, label, textLink } from "@/app/components/scheduling/ui";
import type { BookingRow } from "@/app/lib/scheduling/admin-views";
import { addDays, formatTime, localDate, MONTH_NAMES, WEEKDAY_NAMES, zonedParts, zoneOffsetLabel } from "@/app/lib/scheduling/timezone";

function dayHeading(date: string, today: string, instant: number, tz: string) {
  if (date === today) return "Today";
  if (date === addDays(today, 1)) return "Tomorrow";
  const p = zonedParts(instant, tz);
  return `${WEEKDAY_NAMES[p.weekday]}, ${MONTH_NAMES[p.month - 1]} ${p.day}`;
}

function until(ms: number) {
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `in ${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 36) return `in ${h} ${h === 1 ? "hour" : "hours"}`;
  const d = Math.round(h / 24);
  return `in ${d} days`;
}

/** What is coming up: the next meeting first, then the days ahead. Click anything to manage it. */
export default function Agenda({ rows, homeTimeZone, nowIso }: { rows: BookingRow[]; homeTimeZone: string; nowIso: string }) {
  const tz = homeTimeZone;
  const { routes } = useAdminBase();
  const { open, node } = useBookingDrawer(rows, tz);
  const now = Date.parse(nowIso);
  const upcoming = rows.filter((r) => r.status === "confirmed" && Date.parse(r.endUtc) >= now).sort((a, b) => Date.parse(a.startUtc) - Date.parse(b.startUtc));
  const today = localDate(now, tz);
  const next = upcoming[0];
  const rest = upcoming.slice(next ? 1 : 0, 13);
  const groups: { date: string; instant: number; items: BookingRow[] }[] = [];
  for (const r of rest) {
    const d = localDate(Date.parse(r.startUtc), tz);
    const g = groups.find((x) => x.date === d);
    if (g) g.items.push(r); else groups.push({ date: d, instant: Date.parse(r.startUtc), items: [r] });
  }

  return (
    <div>
      {node}
      {next ? (
        <section aria-labelledby="next-h" className="border-y border-[#1a1816]/[.12] py-8">
          <p id="next-h" className={eyebrow}>Next up</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-4xl font-light tracking-tight md:text-5xl">{dayHeading(localDate(Date.parse(next.startUtc), tz), today, Date.parse(next.startUtc), tz)} <span className="text-[#1a1816]/40">·</span> {formatTime(Date.parse(next.startUtc), tz)}</p>
              <p className="mt-3 text-lg">{next.guestName} <span className="text-[#1a1816]/45">· {next.typeName}</span></p>
              <p className="mt-1 text-sm text-[#1a1816]/50">{until(Date.parse(next.startUtc) - now)} · {zoneOffsetLabel(Date.parse(next.startUtc), tz)}{next.zoom.status === "pending" ? " · Zoom link pending" : ""}</p>
            </div>
            <button type="button" onClick={() => open(next.id)} className={btnQuiet}>Open</button>
          </div>
        </section>
      ) : (
        <p className="border-y border-[#1a1816]/[.12] py-8 text-[#1a1816]/55">Nothing coming up. New bookings will appear here.</p>
      )}

      {groups.length > 0 && (
        <section aria-label="Coming up" className="mt-10">
          {groups.map((g) => (
            <div key={g.date} className="grid gap-x-8 border-b border-[#1a1816]/[.12] py-5 md:grid-cols-[240px_1fr]">
              <h3 className={`${label} pt-1`}>{dayHeading(g.date, today, g.instant, tz)}</h3>
              <ul className="space-y-1">
                {g.items.map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => open(r.id)} className="group flex w-full items-baseline justify-between gap-4 py-2 text-left">
                      <span><span className="inline-block w-24 text-[#1a1816]/85">{formatTime(Date.parse(r.startUtc), tz)}</span><span className="group-hover:text-[#6b1f1f]">{r.guestName}</span> <span className="text-[#1a1816]/45">· {r.typeName}</span></span>
                      {r.zoom.status === "pending" && <span className="text-xs text-[#8b2525]">Zoom pending</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="mt-5 text-sm"><Link href={`${routes}/bookings`} className={textLink}>All bookings →</Link></p>
        </section>
      )}
    </div>
  );
}
