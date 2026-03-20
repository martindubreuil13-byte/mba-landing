import type { ReactNode } from "react";
import { cn } from "@/app/lib/utils";

interface SectionHeadingProps {
  label?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
  children?: ReactNode;
}

export function SectionHeading({
  label,
  title,
  description,
  align = "center",
  className,
  children,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "animate-fadeUp flex flex-col gap-4",
        align === "center" && "items-center text-center",
        align === "left" && "items-start text-left",
        className
      )}
    >
      {label && <p className="eyebrow">{label}</p>}

      <h2 className="text-3xl sm:text-4xl lg:text-[2.8rem] font-semibold tracking-[-0.03em] leading-[1.1] max-w-3xl">
        {title}
      </h2>

      {description && (
        <p className="section-copy max-w-2xl">
          {description}
        </p>
      )}

      {children}
    </div>
  );
}