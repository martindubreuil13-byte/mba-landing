"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getBrowserClient } from "@/app/lib/supabase/browser";

import { CalendarDays, ChevronDown, House, LibraryBig, Mail, Users } from "lucide-react";

const sections = [
  ["Home", "/admin", House, ["/admin"]],
  ["Contacts", "/admin/leads", Users, ["/admin/leads", "/admin/inquiries"]],
  ["Scheduling", "/admin/scheduling", CalendarDays, ["/admin/scheduling"]],
  ["Content", "/admin/content", LibraryBig, ["/admin/content", "/admin/resources", "/admin/guides", "/admin/publications", "/admin/programs"]],
  ["Email Studio", "/admin/email", Mail, ["/admin/email"]],
] as const;

const tools = [
  ["Follow-ups", "/admin/inquiries/tasks"],
  ["Automation exceptions", "/admin/inquiries/exceptions"], ["Website Intelligence", "/admin/intelligence"],
  ["Pick My Brain", "/admin/pick-my-brain"], ["Assessments", "/admin/assessments"],
  ["Napkin submissions", "/admin/napkin"],
] as const;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  async function signOut() {
    await getBrowserClient().auth.signOut();
    router.push("/admin");
    router.refresh();
  }
  return <div className="min-h-screen bg-[#f3eee8] text-[#27211d]">
    <header className="border-b border-[#ded1c7] bg-[#fffcf8]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-8">
        <Link href="/admin" className="inline-flex items-center gap-3 font-serif leading-tight">
          <span className="grid size-10 place-items-center rounded-xl bg-[#6b1f1f] text-2xl text-white">M</span>
          <span>The Modern<br />Business Architect</span>
        </Link>
        <nav aria-label="Admin workspace" className="order-3 flex w-full flex-wrap gap-1 sm:order-none sm:w-auto">
          {sections.map(([label, href, Icon, prefixes]) => {
            const current = prefixes.some((prefix) => pathname === prefix || (prefix !== "/admin" && pathname.startsWith(prefix + "/")));
            return <Link key={href} href={href} aria-current={current ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-[#f3e7e2] ${current ? "bg-[#f3e7e2] font-semibold text-[#6b1f1f]" : "text-[#655951]"}`}>
              <Icon size={17} aria-hidden />{label}
            </Link>;
          })}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-[#6b1f1f]">More <ChevronDown size={14} aria-hidden /></summary>
            <div className="absolute right-0 z-20 mt-2 grid w-52 gap-1 rounded-xl border border-[#e6dcd4] bg-[#fffcf8] p-2 shadow-lg">
              <Link href="/admin/inquiries" className="rounded-lg px-3 py-2 hover:bg-[#f3e7e2]">Inquiries &amp; applications</Link>
              <Link href="/admin/publications" className="rounded-lg px-3 py-2 hover:bg-[#f3e7e2]">Publications</Link>
              <Link href="/admin/scheduling" className="rounded-lg px-3 py-2 hover:bg-[#f3e7e2]">Scheduling overview</Link>
              {tools.map(([label, href]) => <Link key={href} href={href} className="rounded-lg px-3 py-2 hover:bg-[#f3e7e2]">{label}</Link>)}
            </div>
          </details>
          <button type="button" onClick={signOut} className="text-[#655951] hover:underline">Sign out</button>
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-[1400px] px-4 py-7 sm:px-8">{children}</main>
  </div>;
}
