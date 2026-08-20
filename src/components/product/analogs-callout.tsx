import Link from "next/link";
import { PackageSearch } from "lucide-react";

import { formatTenge } from "@/lib/money";
import { ProductThumbnail } from "@/components/catalog/product-thumbnail";
import type { CatalogProduct } from "@/types/catalog";

/**
 * Shown on out-of-stock/on-order product pages to route the buyer to real
 * in-stock substitutes instead of a dead end, ranked by spec similarity
 * (see productService.getAnalogsInStock).
 */
export function AnalogsCallout({ products }: { products: CatalogProduct[] }) {
  if (products.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
        <PackageSearch className="size-4" />
        Похожие товары в наличии
      </div>
      <p className="mt-1 text-xs text-amber-800">
        Этой позиции сейчас нет на складе — вот близкие по параметрам аналоги, которые есть в
        наличии.
      </p>
      <ul className="mt-3 space-y-2">
        {products.map((p) => (
          <li key={p.id}>
            <Link
              href={`/catalog/${p.slug}`}
              className="flex items-center gap-3 rounded-lg border border-amber-200/70 bg-white p-2 transition-colors hover:border-signal-400"
            >
              <ProductThumbnail
                categorySlug={p.categorySlug}
                imageUrl={p.image}
                alt={p.title}
                size="sm"
                className="size-12 shrink-0 rounded-md"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-primary">{p.title}</div>
                <div className="text-xs text-muted-foreground">
                  {p.price !== null ? formatTenge(p.price) : "цена по запросу"}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
