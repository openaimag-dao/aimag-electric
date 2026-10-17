"use client";

import { Eye } from "lucide-react";
import Link from "next/link";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductThumbnail } from "@/components/catalog/product-thumbnail";
import { ProductPrice } from "@/components/catalog/product-price";
import { AvailabilityBadge } from "@/components/catalog/availability-badge";
import { AddToCartWithQty } from "@/components/cart/add-to-cart-with-qty";
import { leadTimeForAvailability } from "@/lib/availability";
import { formatTenge } from "@/lib/money";
import type { CatalogProduct } from "@/types/catalog";

/** Full-size view of a catalog card's own data — no extra fetch, opens in place over the grid. */
export function QuickViewDialog({ product }: { product: CatalogProduct }) {
  const href = `/catalog/${product.slug}`;
  const specs: { label: string; value: string }[] = [
    { label: "Категория", value: product.category },
    product.material ? { label: "Материал", value: product.material } : null,
    product.cores && product.crossSection
      ? { label: "Жилы × сечение", value: `${product.cores}×${product.crossSection} мм²` }
      : product.crossSection
        ? { label: "Сечение", value: `${product.crossSection} мм²` }
        : null,
    product.voltage ? { label: "Напряжение", value: `${product.voltage} кВ` } : null,
  ].filter((s): s is { label: string; value: string } => s !== null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Быстрый просмотр"
          title="Быстрый просмотр"
        >
          <Eye className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-6 text-left font-display text-lg">{product.title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <ProductThumbnail
            categorySlug={product.categorySlug}
            imageUrl={product.image}
            alt={product.title}
            className="h-40 w-full"
          />
          <div>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-signal-700">{product.manufacturer}</span>
              <span className="font-mono text-muted-foreground">{product.sku}</span>
            </div>

            <dl className="mt-2.5 space-y-1 text-sm">
              {specs.map((s) => (
                <div key={s.label} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="font-medium text-primary">{s.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-3 flex items-center gap-2">
              <AvailabilityBadge status={product.availability} lowStock={product.lowStock} />
              <span className="text-xs text-muted-foreground">
                {leadTimeForAvailability(product.availability)}
              </span>
            </div>

            <div className="mt-3">
              <ProductPrice price={product.price} unit={product.unit} className="text-lg" />
              {product.companyPriceTenge != null && (
                <p className="mt-0.5 text-xs font-medium text-emerald-700">
                  Ваша цена: {formatTenge(product.companyPriceTenge)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <AddToCartWithQty
            unit={product.unit}
            product={{
              productId: product.id,
              slug: product.slug,
              sku: product.sku,
              title: product.title,
              unit: product.unit,
              priceTenge: product.companyPriceTenge ?? product.price,
            }}
          />
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={href}>Открыть полную страницу товара</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
