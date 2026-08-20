"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";

/** Header entry point into the project cart, with a live item count. */
export function CartBadge() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Проект: ${count} позиций`}
      className="relative inline-flex size-9 items-center justify-center rounded-md text-steel-600 transition-colors hover:bg-secondary hover:text-primary"
    >
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-signal text-[10px] font-semibold text-steel-950">
          {count > 9 ? "9+" : Math.round(count)}
        </span>
      )}
    </Link>
  );
}
