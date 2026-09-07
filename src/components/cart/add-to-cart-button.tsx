"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import type { CartItem } from "@/types/cart";

interface AddToCartButtonProps {
  product: Omit<CartItem, "qty">;
  qty?: number;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  label?: string;
}

/** Adds one product to the client-side cart (see CartProvider). */
export function AddToCartButton({
  product,
  qty = 1,
  variant = "outline",
  size = "default",
  className,
  label = "Добавить в корзину",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const [justAdded, setJustAdded] = React.useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, qty);
    // A visible cart icon isn't always in reach (e.g. deep in a long product
    // page on mobile) — the toast's own action is a direct, unmissable path
    // to the cart right when it matters most, not just a fire-and-forget note.
    toast.success(`${product.title} — добавлено в корзину`, {
      action: { label: "Перейти в корзину", onClick: () => router.push("/cart") },
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleClick} type="button">
      {justAdded ? <Check /> : <ShoppingCart />}
      {justAdded ? "Добавлено" : label}
    </Button>
  );
}
