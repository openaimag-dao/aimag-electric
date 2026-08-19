"use client";

import * as React from "react";
import { ZoomIn } from "lucide-react";

import { cn } from "@/lib/utils";
import { ProductThumbnail } from "@/components/catalog/product-thumbnail";
import { Badge } from "@/components/ui/badge";

/**
 * Product gallery. Renders the product's real photos when available; falls
 * back to a category-coded plate otherwise. Large main view + selectable
 * thumbnail strip.
 */
export function ProductGallery({
  categorySlug,
  images,
  count,
  badge,
  title,
}: {
  categorySlug: string;
  images?: string[];
  count: number;
  badge?: string;
  title: string;
}) {
  const [active, setActive] = React.useState(0);
  const photos = images ?? [];
  const views = photos.length > 0 ? photos : Array.from({ length: Math.max(1, count) });

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border">
        <ProductThumbnail
          categorySlug={categorySlug}
          imageUrl={photos[active]}
          alt={title}
          className="h-full w-full"
          size="grid"
        />
        {badge && (
          <Badge variant="signal" className="absolute left-4 top-4 shadow-sm">
            {badge}
          </Badge>
        )}
        <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-steel-950/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          <ZoomIn className="size-3.5" />
          {title}
        </span>
      </div>

      {views.length > 1 && (
        <div className="grid grid-cols-5 gap-2.5">
          {views.map((photo, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Вид ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "aspect-square overflow-hidden rounded-lg border-2 transition-colors",
                i === active ? "border-signal" : "border-border hover:border-steel-300"
              )}
            >
              <ProductThumbnail
                categorySlug={categorySlug}
                imageUrl={typeof photo === "string" ? photo : undefined}
                alt={title}
                className="h-full w-full"
                size="sm"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
