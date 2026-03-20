import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/app/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type Base = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type AsButton = Base &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

type AsLink = Base &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> & {
    href: string;
  };

export type ButtonProps = AsButton | AsLink;

/* 🎯 VARIANTS (REAL HIERARCHY) */
const variants: Record<Variant, string> = {
  primary:
    "bg-cyan-300 text-slate-950 font-semibold shadow-[0_18px_50px_-20px_rgba(103,232,249,0.9)] hover:bg-cyan-200 active:scale-[0.98]",

  secondary:
    "bg-white/[0.06] text-white border border-white/12 hover:bg-white/[0.1] active:scale-[0.98]",

  ghost:
    "text-white/70 hover:text-white hover:bg-white/[0.06]",
};

/* 📏 SIZES */
const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-sm",
  lg: "h-[3.25rem] px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const base = cn(
    "inline-flex items-center justify-center rounded-full transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60",
    "disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    className
  );

  /* LINK */
  if ("href" in props && props.href) {
    const { href, children, ...rest } = props;
    return (
      <Link
        href={href}
        className={base}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    );
  }

  /* BUTTON */
  const { children, ...rest } = props as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button className={base} {...rest}>
      {children}
    </button>
  );
}