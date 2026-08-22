"use client";

import { Heart } from "lucide-react";

import { useFavorites } from "@/components/favorites/favorites-provider";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const { has, toggle } = useFavorites();
  const active = has(productId);

  return (
    <button
      type="button"
      aria-label={active ? "Убрать из избранного" : "Добавить в избранное"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full bg-background/90 text-steel-500 shadow-sm backdrop-blur transition-colors hover:text-red-500",
        active && "text-red-500",
        className
      )}
    >
      <Heart className={cn("size-4", active && "fill-current")} />
    </button>
  );
}
