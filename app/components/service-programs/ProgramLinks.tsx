import Link from "next/link";
import { PROGRAMS, programPath } from "@/app/lib/service-programs/catalog";

/** Plain, crawlable links to every program page. Names only: this is not a comparison table. */
export default function ProgramLinks({ exclude, className = "" }: { exclude?: string; className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-6 gap-y-1 ${className}`}>
      {PROGRAMS.filter((p) => p.number !== exclude).map((p) => (
        <li key={p.number}>
          <Link href={programPath(p)} className="inline-flex min-h-11 items-center underline underline-offset-4 decoration-current/40 hover:decoration-current">
            {p.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
