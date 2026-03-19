import type { ReactNode } from "react";
import { cn } from "@/app/lib/utils";

interface SectionHeadingProps {
  label: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function SectionHeading({
  label,
  title,
  description,
  children,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("animate-fadeUp", className)}>
      <p className="text-sm font-semibold uppercase tracking-widest text-cyan-200/80">
        {label}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}
