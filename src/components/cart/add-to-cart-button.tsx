"use client";

import * as React from "react";
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

/** Adds one product to the client-side project cart (see CartProvider). */
export function AddToCartButton({
  product,
  qty = 1,
  variant = "outline",
  size = "default",
  className,
  label = "Добавить в проект",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = React.useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, qty);
    toast.success(`${product.title} — добавлено в проект`);
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
