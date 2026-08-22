"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Scale, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { AvailabilityBadge } from "@/components/catalog/availability-badge";
import { ProductPrice } from "@/components/catalog/product-price";
import { ProductThumbnail } from "@/components/catalog/product-thumbnail";
import { useCompare } from "@/components/compare/compare-provider";
import { getProductsByIds } from "@/server/actions/product-lookup-actions";
import { cn } from "@/lib/utils";
import type { AttributeDef, CatalogProduct } from "@/types/catalog";

interface Row {
  key: string;
  label: string;
  value: (p: CatalogProduct) => string;
  node?: (p: CatalogProduct) => React.ReactNode;
}

const BASE_ROWS: Row[] = [
  { key: "manufacturer", label: "Производитель", value: (p) => p.manufacturer },
  { key: "sku", label: "Артикул", value: (p) => p.sku },
  {
    key: "price",
    label: "Цена",
    value: (p) => (p.price === null ? "по запросу" : String(p.price)),
    node: (p) => <ProductPrice price={p.price} unit={p.unit} className="text-base" />,
  },
  {
    key: "availability",
    label: "Наличие",
    value: (p) => p.availability,
    node: (p) => <AvailabilityBadge status={p.availability} />,
  },
];

function formatAttrValue(raw: string | number, unit?: string | null): string {
  return unit ? `${raw} ${unit}` : String(raw);
}

export function ComparePageClient({ attributeDefs }: { attributeDefs: AttributeDef[] }) {
  const { ids, remove, clear } = useCompare();
  const [products, setProducts] = React.useState<CatalogProduct[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getProductsByIds(ids).then((rows) => {
      if (!cancelled) setProducts(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  const attrRows = React.useMemo<Row[]>(() => {
    if (!products) return [];
    const defByKey = new Map(attributeDefs.map((d) => [d.key, d]));
    const keys = new Set<string>();
    for (const p of products) for (const k of Object.keys(p.attrs ?? {})) keys.add(k);
    return Array.from(keys)
      .map((key) => {
        const def = defByKey.get(key);
        return {
          key,
          def,
          label: def?.name ?? key,
        };
      })
      .sort((a, b) => (a.def?.order ?? 999) - (b.def?.order ?? 999))
      .map(({ key, def, label }) => ({
        key,
        label,
        value: (p: CatalogProduct) =>
          p.attrs?.[key] !== undefined ? formatAttrValue(p.attrs[key], def?.unit) : "—",
      }));
  }, [products, attributeDefs]);

  const rows = [...BASE_ROWS, ...attrRows];

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-sm text-muted-foreground">Личный кабинет</p>
          <h1 className="font-display text-2xl font-bold text-primary">Сравнение товаров</h1>
        </div>
        {ids.length > 0 && (
          <Button variant="outline" size="sm" onClick={clear}>
            Очистить список
          </Button>
        )}
      </div>

      {ids.length === 0 ? (
        <EmptyCompare />
      ) : products === null ? (
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Загрузка…
        </div>
      ) : products.length < 2 ? (
        <EmptyCompare text="Добавьте ещё хотя бы один товар, чтобы увидеть сравнение." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-40 border-b border-border p-3 text-left align-bottom text-xs font-medium text-muted-foreground">
                  Характеристика
                </th>
                {products.map((p) => (
                  <th
                    key={p.id}
                    className="min-w-[200px] border-b border-border p-3 text-left align-bottom"
                  >
                    <div className="relative">
                      <button
                        type="button"
                        aria-label="Убрать из сравнения"
                        onClick={() => remove(p.id)}
                        className="absolute -right-1 -top-1 inline-flex size-6 items-center justify-center rounded-full bg-background text-steel-500 shadow-sm hover:text-red-500"
                      >
                        <X className="size-3.5" />
                      </button>
                      <Link href={`/catalog/${p.slug}`}>
                        <ProductThumbnail
                          categorySlug={p.categorySlug}
                          imageUrl={p.image}
                          alt={p.title}
                          className="h-24 w-full"
                        />
                      </Link>
                      <Link
                        href={`/catalog/${p.slug}`}
                        className="mt-2 block text-sm font-semibold leading-snug text-primary hover:text-signal-700"
                      >
                        {p.title}
                      </Link>
                      <AddToCartButton
                        variant="signal"
                        size="sm"
                        label="В проект"
                        className="mt-2 w-full"
                        product={{
                          productId: p.id,
                          slug: p.slug,
                          sku: p.sku,
                          title: p.title,
                          unit: p.unit,
                          priceTenge: p.price,
                        }}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const values = products.map((p) => row.value(p));
                const differs = new Set(values).size > 1;
                return (
                  <tr key={row.key} className={cn(differs && "bg-signal/5")}>
                    <td className="border-b border-border p-3 text-sm font-medium text-primary">
                      {row.label}
                    </td>
                    {products.map((p, i) => (
                      <td key={p.id} className="border-b border-border p-3 text-sm text-steel-700">
                        {row.node ? row.node(p) : values[i]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyCompare({
  text = "Выберите 2–4 товара в каталоге, чтобы сравнить их характеристики.",
}: {
  text?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-secondary text-steel-500">
        <Scale className="size-7" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-primary">
        Пока нечего сравнивать
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
      <Button asChild className="mt-6">
        <Link href="/catalog">Перейти в каталог</Link>
      </Button>
    </div>
  );
}
