"use client";

import * as React from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/common/quote-form";
import { useCart } from "@/components/cart/cart-provider";
import { formatTenge } from "@/lib/money";

export function CartView() {
  const { items, totalTenge, hasUnpricedItems, removeItem, setQty, clear } = useCart();
  const [requesting, setRequesting] = React.useState(false);

  if (items.length === 0 && !requesting) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
        <ShoppingCart className="size-10 text-muted-foreground" />
        <div>
          <p className="font-display text-lg font-semibold text-primary">Проект пуст</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Добавляйте товары из каталога кнопкой «В проект» — соберите спецификацию и запросите
            одно КП на все позиции.
          </p>
        </div>
        <Button asChild variant="signal">
          <Link href="/catalog">Перейти в каталог</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <Link
                href={`/catalog/${item.slug}`}
                className="font-medium text-primary hover:text-signal-700"
              >
                {item.title}
              </Link>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">Арт. {item.sku}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 rounded-md border border-border">
                <button
                  type="button"
                  aria-label="Уменьшить количество"
                  className="flex size-8 items-center justify-center text-steel-600 hover:text-primary"
                  onClick={() => setQty(item.productId, item.qty - 1)}
                  disabled={item.qty <= 1}
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="min-w-10 text-center text-sm tabular-nums">
                  {item.qty} {item.unit}
                </span>
                <button
                  type="button"
                  aria-label="Увеличить количество"
                  className="flex size-8 items-center justify-center text-steel-600 hover:text-primary"
                  onClick={() => setQty(item.productId, item.qty + 1)}
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              <span className="w-28 text-right text-sm font-semibold text-primary">
                {item.priceTenge !== null ? formatTenge(item.priceTenge * item.qty) : "по запросу"}
              </span>

              <button
                type="button"
                aria-label="Удалить из проекта"
                className="text-muted-foreground hover:text-red-600"
                onClick={() => removeItem(item.productId)}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}

        {items.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-4">
            <span className="text-sm text-muted-foreground">
              Итого{hasUnpricedItems && ", часть позиций — по запросу"}
            </span>
            <span className="font-display text-xl font-bold text-primary">
              {formatTenge(totalTenge)}
            </span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24 lg:self-start">
        <h2 className="font-display text-lg font-semibold text-primary">Получить КП по проекту</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Инженер проверит наличие и пришлёт коммерческое предложение со всеми позициями.
        </p>
        <div className="mt-4">
          <QuoteForm
            items={items}
            onSuccess={() => {
              setRequesting(true);
              clear();
            }}
          />
        </div>
      </div>
    </div>
  );
}
