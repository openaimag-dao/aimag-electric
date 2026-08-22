"use client";

import * as React from "react";

import { ProductCard } from "@/components/catalog/product-card";
import { useRecentlyViewed } from "@/components/recently-viewed/recently-viewed-provider";
import { getProductsByIds } from "@/server/actions/product-lookup-actions";
import type { CatalogProduct } from "@/types/catalog";

/** Horizontal "recently viewed" strip — excludes the product currently open, hides itself when empty. */
export function RecentlyViewedSection({ excludeProductId }: { excludeProductId?: string }) {
  const { ids } = useRecentlyViewed();
  const [products, setProducts] = React.useState<CatalogProduct[] | null>(null);

  const lookupIds = React.useMemo(
    () => ids.filter((id) => id !== excludeProductId).slice(0, 8),
    [ids, excludeProductId]
  );

  React.useEffect(() => {
    if (lookupIds.length === 0) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    getProductsByIds(lookupIds).then((rows) => {
      if (!cancelled) setProducts(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [lookupIds]);

  if (!products || products.length === 0) return null;

  return (
    <section className="border-t border-border pt-12">
      <h2 className="font-display text-2xl font-bold tracking-tight text-primary">
        Недавно просмотренные
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
