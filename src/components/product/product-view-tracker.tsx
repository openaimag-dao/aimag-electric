"use client";

import * as React from "react";

import { track } from "@/lib/analytics";

/** Invisible — fires the product_view analytics event once per page view. */
export function ProductViewTracker({
  productId,
  sku,
  categorySlug,
  price,
}: {
  productId: string;
  sku: string;
  categorySlug: string;
  price: number | null;
}) {
  React.useEffect(() => {
    track("product_view", { productId, sku, categorySlug, price: price ?? undefined });
    // Only re-fire if the viewed product itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return null;
}
