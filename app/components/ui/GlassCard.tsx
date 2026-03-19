import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/app/lib/utils";

export function GlassCard({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "glass rounded-3xl border-white/10 p-6 text-white/90 shadow-xl shadow-black/40",
        className,
      )}
      {...props}
    />
  );
}
