"use client";

import * as React from "react";

import { useRecentlyViewed } from "@/components/recently-viewed/recently-viewed-provider";
import { track } from "@/lib/analytics";

/** Invisible — records the current product into the recently-viewed trail on mount. */
export function RecordRecentlyViewed({ productId }: { productId: string }) {
  const { record } = useRecentlyViewed();

  React.useEffect(() => {
    record(productId);
    track("product_view", { productId });
    // Only re-record if the viewed product itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return null;
}
