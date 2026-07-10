import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Render mark on dark backgrounds (footer, hero). */
  variant?: "light" | "dark";
}

/**
 * AIMAG ELECTRIC wordmark. The mark is a stylized "A" drawn as a live
 * conductor terminal — a nod to the product world rather than a stock icon.
 */
export function Logo({ className, variant = "dark" }: LogoProps) {
  const isLight = variant === "light";
  return (
    <Link
      href="/"
      aria-label="AIMAG ELECTRIC — на главную"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span className="relative inline-flex size-9 items-center justify-center rounded-md bg-signal">
        <svg
          viewBox="0 0 24 24"
          className="size-5 text-steel-950"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 20 L12 4 L19 20" />
          <path d="M8.2 13.5 H15.8" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[15px] font-bold tracking-tight",
            isLight ? "text-white" : "text-primary"
          )}
        >
          AIMAG
        </span>
        <span
          className={cn(
            "font-mono text-[10px] font-medium uppercase tracking-[0.32em]",
            isLight ? "text-signal" : "text-signal-600"
          )}
        >
          Electric
        </span>
      </span>
    </Link>
  );
}
