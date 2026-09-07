"use client";

import * as React from "react";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { QuantityInput } from "@/components/catalog/quantity-input";
import type { CartItem } from "@/types/cart";

/** Quantity stepper paired with add-to-cart, for catalog cards and the purchase panel. */
export function AddToCartWithQty({
  product,
  unit,
  layout = "inline",
  buttonSize = "sm",
}: {
  product: Omit<CartItem, "qty">;
  unit: string;
  /** "inline" sits the stepper next to a compact button (catalog card); "stacked" puts a full-width stepper above a full-width button (purchase panel). */
  layout?: "inline" | "stacked";
  buttonSize?: "sm" | "lg";
}) {
  const [qty, setQty] = React.useState(1);

  if (layout === "stacked") {
    return (
      <div className="flex flex-col gap-2.5">
        <QuantityInput value={qty} onChange={setQty} unit={unit} className="w-full" />
        <AddToCartButton size={buttonSize} className="w-full" qty={qty} product={product} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <QuantityInput value={qty} onChange={setQty} unit={unit} size="sm" className="shrink-0" />
      <AddToCartButton
        variant="signal"
        size={buttonSize}
        label="В корзину"
        qty={qty}
        product={product}
        className="flex-1"
      />
    </div>
  );
}
