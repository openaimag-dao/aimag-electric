"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/catalog/product-card";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { getProductsByIds } from "@/server/actions/product-lookup-actions";
import type { CatalogProduct } from "@/types/catalog";

export function FavoritesPageClient() {
  const { ids, clear } = useFavorites();
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

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-sm text-muted-foreground">Личный кабинет</p>
          <h1 className="font-display text-2xl font-bold text-primary">Избранное</h1>
        </div>
        {ids.length > 0 && (
          <Button variant="outline" size="sm" onClick={clear}>
            Очистить список
          </Button>
        )}
      </div>

      {ids.length === 0 ? (
        <EmptyFavorites />
      ) : products === null ? (
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Загрузка…
        </div>
      ) : products.length === 0 ? (
        <EmptyFavorites text="Товары из избранного больше не доступны в каталоге." />
      ) : (
        <>
          {products.length < ids.length && (
            <p className="mb-4 text-sm text-muted-foreground">
              {ids.length - products.length}{" "}
              {ids.length - products.length === 1 ? "товар" : "товара"} из списка сняты с
              публикации.
            </p>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyFavorites({
  text = "Сохраняйте товары, чтобы вернуться к ним позже.",
}: {
  text?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-secondary text-steel-500">
        <Heart className="size-7" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-primary">Пока пусто</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
      <Button asChild className="mt-6">
        <Link href="/catalog">Перейти в каталог</Link>
      </Button>
    </div>
  );
}
