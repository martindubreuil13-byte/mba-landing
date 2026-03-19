import type { ReactNode } from "react";

interface IconWrapperProps {
  className?: string;
  children: ReactNode;
  gradient?: string;
}

export function IconWrapper({ className, children, gradient }: IconWrapperProps) {
  return (
    <span
      className={
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-[0_12px_32px_-18px_rgba(0,0,0,0.6)] " +
        (gradient ?? "bg-gradient-to-br from-cyan-400/80 via-sky-300/60 to-indigo-400/60") +
        (className ? ` ${className}` : "")
      }
    >
      {children}
    </span>
  );
}

export function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
      <path d="M9.5 14.5 13.5 10.5 14.5 13.5 10.5 14.5 9.5 14.5Z" />
      <path d="M13.5 10.5 9.5 9.5" />
    </svg>
  );
}

export function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 4 4 5-5" />
    </svg>
  );
}

export function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l7 4v6c0 5-3.5 9.74-7 10-3.5-.26-7-5-7-10V6l7-4Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
