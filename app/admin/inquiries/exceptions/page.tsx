import Link from "next/link";
import { CircleAlert } from "lucide-react";
import AdminShell from "@/app/components/admin/AdminShell";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { automationExceptions, businessTimeZone } from "@/app/lib/relationships/queries";
import { workspaceStamp } from "@/app/lib/relationships/model";

export const dynamic = "force-dynamic";

const views = [
  ["attention", "Action Required"],
  ["recovering", "Recovering"],
  ["resolved", "Resolved"],
] as const;

export default async function Exceptions({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireAdmin();
  const { view } = await searchParams;
  const [key, state] = views.find(([candidate]) => candidate === view) ?? views[0];
  const [records, timeZone] = await Promise.all([automationExceptions(), businessTimeZone()]);
  const exceptions = records.filter((item) => item.state === state);
  return <AdminShell>
    <Link href="/admin/inquiries" className="text-sm text-[#6b1f1f] hover:underline">← Inquiries &amp; applications</Link>
    <h1 className="my-6 text-4xl font-light">Automation exceptions</h1>
    <nav aria-label="Exception status" className="mb-5 flex flex-wrap gap-3">
      {views.map(([value, label]) => <Link key={value} href={"/admin/inquiries/exceptions?view=" + value}
        aria-current={value === key ? "page" : undefined}
        className="rounded-full border border-[#6b1f1f]/20 px-4 py-2 text-sm aria-[current=page]:bg-[#6b1f1f] aria-[current=page]:text-white">
        {label}
      </Link>)}
    </nav>
    {!exceptions.length && <p className="rounded-2xl border border-black/10 bg-white p-5">No matching exceptions in the recent records checked.</p>}
    <ul className="grid gap-3 md:grid-cols-2">
      {exceptions.map((item) => <li key={item.key} className="rounded-2xl border border-[#6b1f1f]/10 bg-white p-5 shadow-sm">
        <p className="flex items-center gap-2"><CircleAlert size={17} className="text-[#6b1f1f]" aria-hidden />{item.label}</p>
        <time className="mt-2 block text-xs text-black/60" dateTime={item.at}>{workspaceStamp(item.at, timeZone)}</time>
        {item.href ? <Link href={item.href} className="mt-3 inline-block text-sm text-[#6b1f1f] hover:underline">Open inquiry →</Link>
          : <p className="mt-3 break-all text-xs text-black/65">Reference {item.reference}</p>}
      </li>)}
    </ul>
  </AdminShell>;
}
