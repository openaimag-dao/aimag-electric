"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { useFavorites } from "@/components/favorites/favorites-provider";

export function FavoritesBadge() {
  const { count } = useFavorites();

  return (
    <Link
      href="/favorites"
      aria-label={`Избранное: ${count} товаров`}
      className="relative inline-flex size-9 items-center justify-center rounded-md text-steel-600 transition-colors hover:bg-secondary hover:text-primary"
    >
      <Heart className="size-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-signal text-[10px] font-semibold text-steel-950">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
