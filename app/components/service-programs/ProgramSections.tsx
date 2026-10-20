import type { ServiceProgram } from "@/app/lib/service-programs/catalog";

/** Presentational pieces shared by the /work slider details and the dedicated program pages. No hooks, no client state. */

export function ProcessList({ program }: { program: ServiceProgram }) {
  return (
    <ol className="space-y-3 text-base leading-relaxed text-[#1a1816]/85">
      {program.process.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden className="mt-0.5 w-5 shrink-0 text-sm tabular-nums text-[#6b1f1f]">{i + 1}.</span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-base leading-relaxed text-[#1a1816]/85">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export const H4 = "text-sm font-semibold text-[#1a1816]";
