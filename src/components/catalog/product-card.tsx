import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductThumbnail } from "@/components/catalog/product-thumbnail";
import { ProductPrice } from "@/components/catalog/product-price";
import { AvailabilityBadge } from "@/components/catalog/availability-badge";
import { FavoriteButton } from "@/components/catalog/favorite-button";
import { CompareToggleButton } from "@/components/catalog/compare-toggle-button";
import type { CatalogProduct } from "@/types/catalog";

/**
 * Catalog product card. Contains every required element: visual, title,
 * manufacturer, SKU, price, availability, and both CTAs (Подробнее / КП).
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: CatalogProduct;
  /** Mark true only for the first card above the fold (LCP). */
  priority?: boolean;
}) {
  const href = `/catalog/${product.slug}`;

  const specs = [
    product.material,
    product.cores && product.crossSection
      ? `${product.cores}×${product.crossSection} мм²`
      : product.crossSection
        ? `${product.crossSection} мм²`
        : null,
    product.voltage ? `${product.voltage} кВ` : null,
  ].filter(Boolean) as string[];

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-signal/60 hover:shadow-lg">
      <div className="relative">
        <Link href={href} aria-label={product.title}>
          <ProductThumbnail
            categorySlug={product.categorySlug}
            imageUrl={product.image}
            alt={product.title}
            className="h-40 w-full"
            priority={priority}
          />
        </Link>
        {product.badge && (
          <Badge variant="signal" className="absolute left-3 top-3 shadow-sm">
            {product.badge}
          </Badge>
        )}
        <AvailabilityBadge
          status={product.availability}
          className="absolute right-3 top-3 shadow-sm"
        />
        <FavoriteButton productId={product.id} className="absolute bottom-3 right-3" />
        <CompareToggleButton productId={product.id} className="absolute bottom-3 left-3" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Manufacturer + SKU */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-signal-700">{product.manufacturer}</span>
          <span className="font-mono text-muted-foreground">{product.sku}</span>
        </div>

        <h3 className="mt-1.5 font-display text-sm font-semibold leading-snug text-primary">
          <Link href={href} className="transition-colors hover:text-signal-700">
            {product.title}
          </Link>
        </h3>

        {specs.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {specs.map((spec) => (
              <span
                key={spec}
                className="rounded border border-border bg-secondary/60 px-1.5 py-0.5 font-mono text-[10px] text-steel-600"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-end justify-between gap-2 pt-1">
          <ProductPrice price={product.price} unit={product.unit} className="text-lg" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={href}>Подробнее</Link>
          </Button>
          <AddToCartButton
            variant="signal"
            size="sm"
            label="В проект"
            product={{
              productId: product.id,
              slug: product.slug,
              sku: product.sku,
              title: product.title,
              unit: product.unit,
              priceTenge: product.price,
            }}
          />
        </div>
      </div>
    </article>
  );
}
