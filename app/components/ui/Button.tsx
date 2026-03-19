import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/app/lib/utils";

type ButtonVariant = "primary" | "secondary";

type ButtonSize = "sm" | "md" | "lg";

type ButtonBase = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = ButtonBase & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  href?: undefined;
};

type ButtonAsLink = ButtonBase & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> & {
  href: string;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-cyan-400/90 via-sky-400/60 to-indigo-400/70 text-black shadow-[0_12px_32px_-14px_rgba(56,189,248,0.75)] hover:shadow-[0_18px_56px_-22px_rgba(56,189,248,0.7)] hover:scale-[1.02]",
  secondary:
    "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15 hover:ring-white/30",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-base",
  lg: "h-14 px-6 text-base font-semibold",
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  const base = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
    variantStyles[variant],
    sizeStyles[size],
    className,
  );

  if (typeof props.href === "string") {
    const { href, ...rest } = props;
    return (
      <Link href={href} className={base} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {props.children}
      </Link>
    );
  }

  const { children, ...rest } = props as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button type="button" className={base} {...rest}>
      {children}
    </button>
  );
}
