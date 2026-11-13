import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";

export default function WorkspaceDirectory({ title, entries }: {
  title: string;
  entries: readonly (readonly [label: string, description: string, href: string])[];
}) {
  return <section>
    <h1 className="mb-6 font-serif text-4xl tracking-tight">{title}</h1>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {entries.map(([label, description, href]) => <Link key={href} href={href}
        className="rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] p-5 shadow-sm hover:shadow-md motion-safe:transition-shadow">
        <span className="mb-3 flex items-center justify-between text-[#6b1f1f]"><FileText aria-hidden /><ArrowUpRight aria-hidden size={16} /></span>
        <h2 className="font-serif text-xl">{label}</h2><p className="mt-1 text-sm text-[#655951]">{description}</p>
      </Link>)}
    </div>
  </section>;
}
