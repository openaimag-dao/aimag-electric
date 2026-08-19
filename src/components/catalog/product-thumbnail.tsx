import Image from "next/image";
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
 * Product visual. Renders the product's photo when available; falls back to
 * a clean, category-coded "nameplate" for products without one yet.
 */
export function ProductThumbnail({
  categorySlug,
  imageUrl,
  alt,
  className,
  size = "grid",
}: {
  categorySlug: string;
  imageUrl?: string | null;
  alt?: string;
  className?: string;
  size?: "grid" | "sm";
}) {
  if (imageUrl) {
    return (
      <div className={cn("relative overflow-hidden bg-white", className)}>
        <Image
          src={imageUrl}
          alt={alt ?? ""}
          fill
          className="object-contain p-2"
          sizes="(max-width: 768px) 50vw, 300px"
        />
      </div>
    );
  }

  const Icon = iconByCategory[categorySlug] ?? Cable;
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-steel-950",
        className
      )}
    >
      <div className="conductor-grid absolute inset-0 opacity-30" aria-hidden />
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
