import {
  Cable,
  Zap,
  Shield,
  Link2,
  Combine,
  ToggleRight,
  Factory,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const iconByCategory: Record<string, LucideIcon> = {
  kabeli: Cable,
  provoda: Zap,
  izolyatory: Shield,
  "armatura-sip": Link2,
  mufty: Combine,
  avtomaty: ToggleRight,
  vysokovoltnoe: Factory,
};

/**
 * Product visual. Instead of low-quality stock photography we render a clean,
 * category-coded "nameplate" — crisp at any density and on-brand for B2B.
 */
export function ProductThumbnail({
  categorySlug,
  className,
  size = "grid",
}: {
  categorySlug: string;
  className?: string;
  size?: "grid" | "sm";
}) {
  const Icon = iconByCategory[categorySlug] ?? Cable;
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-steel-950",
        className
      )}
    >
      <div className="absolute inset-0 conductor-grid opacity-30" aria-hidden />
      <div
        className="absolute -right-8 -top-8 size-24 rounded-full bg-signal/15 blur-2xl"
        aria-hidden
      />
      <Icon
        className={cn("relative text-signal", size === "grid" ? "size-14" : "size-8")}
        strokeWidth={1.5}
        aria-hidden
      />
    </div>
  );
}
