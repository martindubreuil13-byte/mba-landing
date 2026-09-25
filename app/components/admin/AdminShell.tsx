"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getBrowserClient } from "@/app/lib/supabase/browser";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isResources = pathname.startsWith("/admin/resources");
  const isLeads = pathname.startsWith("/admin/leads");
  const isAssessments = pathname.startsWith("/admin/assessments");
  const isPickMyBrain = pathname.startsWith("/admin/pick-my-brain");

  const handleSignOut = async () => {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#f5f1ed] text-[#1a1816]">
      <header className="border-b border-[#1a1816]/10 px-6 md:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]">Admin</p>
          <nav className="flex items-center gap-6">
            <Link
              href="/admin/resources"
              className={`text-sm tracking-wide ${
                isResources ? "text-[#6b1f1f] font-semibold" : "text-[#1a1816]/60 hover:text-[#1a1816]"
              }`}
            >
              Resources
            </Link>
            <Link
              href="/admin/leads"
              className={`text-sm tracking-wide ${
                isLeads ? "text-[#6b1f1f] font-semibold" : "text-[#1a1816]/60 hover:text-[#1a1816]"
              }`}
            >
              Leads
            </Link>
            <Link
              href="/admin/assessments"
              className={`text-sm tracking-wide ${
                isAssessments ? "text-[#6b1f1f] font-semibold" : "text-[#1a1816]/60 hover:text-[#1a1816]"
              }`}
            >
              Reality Check
            </Link>
            <Link
              href="/admin/pick-my-brain"
              className={`text-sm tracking-wide ${
                isPickMyBrain ? "text-[#6b1f1f] font-semibold" : "text-[#1a1816]/60 hover:text-[#1a1816]"
              }`}
            >
              Pick My Brain
            </Link>
          </nav>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs tracking-widest uppercase text-[#1a1816]/50 hover:text-[#1a1816]"
        >
          Sign out
        </button>
      </header>
      <main className="px-6 md:px-12 py-10">{children}</main>
    </div>
  );
}
