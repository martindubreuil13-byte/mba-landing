import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/app/lib/utils";

interface GlassCardProps extends ComponentPropsWithoutRef<"div"> {
  variant?: "default" | "strong" | "subtle";
  padding?: "sm" | "md" | "lg";
}

export function GlassCard({
  className,
  variant = "default",
  padding = "md",
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border backdrop-blur-xl transition-all duration-300",

        /* VARIANTS */
        variant === "default" &&
          "bg-white/[0.04] border-white/10 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]",

        variant === "strong" &&
          "bg-white/[0.06] border-white/15 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]",

        variant === "subtle" &&
          "bg-white/[0.02] border-white/5 shadow-none",

        /* PADDING */
        padding === "sm" && "p-4",
        padding === "md" && "p-6",
        padding === "lg" && "p-8",

        /* INTERACTION */
        "hover:border-white/20 hover:shadow-[0_30px_90px_-40px_rgba(0,0,0,1)]",

        "text-white/90",
        className
      )}
      {...props}
    />
  );
}