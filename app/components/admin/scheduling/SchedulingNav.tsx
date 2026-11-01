"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminBase } from "./AdminContext";

const ITEMS = [
  { path: "", label: "Overview", exact: true },
  { path: "/calendar", label: "Calendar" },
  { path: "/bookings", label: "Bookings" },
  { path: "/meeting-types", label: "Meeting types" },
  { path: "/availability", label: "Availability" },
  { path: "/integrations", label: "Integrations" },
];

export default function SchedulingNav() {
  const pathname = usePathname();
  const { routes } = useAdminBase();
  return (
    <nav aria-label="Scheduling" className="mb-10 flex flex-wrap gap-x-8 gap-y-2 border-b border-[#1a1816]/[.12]">
      {ITEMS.map((i) => {
        const href = routes + i.path;
        const on = i.exact ? pathname === href : pathname.startsWith(href);
        return <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`-mb-px border-b pb-3 text-sm tracking-wide transition ${on ? "border-[#6b1f1f] text-[#6b1f1f]" : "border-transparent text-[#1a1816]/55 hover:text-[#1a1816]"}`}>{i.label}</Link>;
      })}
    </nav>
  );
}
