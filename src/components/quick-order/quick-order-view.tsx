"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Search, CheckCircle2, XCircle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { QuantityInput } from "@/components/catalog/quantity-input";
import { useCart } from "@/components/cart/cart-provider";
import { getProductsBySkus, type SkuLookupLine } from "@/server/actions/product-lookup-actions";
import { parseSkuLines } from "@/lib/quick-order-parse";
import { formatTenge } from "@/lib/money";

const PLACEHOLDER = `KAB-1001 10
AVT-1039 5
889 2`;

export function QuickOrderView() {
  const { addItem } = useCart();
  const [text, setText] = React.useState("");
  const [rows, setRows] = React.useState<SkuLookupLine[]>([]);
  const [pending, setPending] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

  async function handleSearch() {
    const lines = parseSkuLines(text);
    if (lines.length === 0) {
      toast.error("Вставьте хотя бы одну строку с артикулом");
      return;
    }
    setPending(true);
    try {
      const result = await getProductsBySkus(lines.map((l) => ({ sku: l.sku, qty: l.qty })));
      if (result.length === 0) {
        toast.error("Слишком много запросов подряд — попробуйте через минуту");
        return;
      }
      setRows(result);
      setSearched(true);
    } finally {
      setPending(false);
    }
  }

  function setQty(sku: string, qty: number) {
    setRows((prev) => prev.map((r) => (r.sku === sku ? { ...r, qty } : r)));
  }

  function removeRow(sku: string) {
    setRows((prev) => prev.filter((r) => r.sku !== sku));
  }

  const found = rows.filter((r) => r.product);
  const notFound = rows.filter((r) => !r.product);

  function addAllToCart() {
    for (const row of found) {
      if (!row.product) continue;
      addItem(
        {
          productId: row.product.id,
          slug: row.product.slug,
          sku: row.product.sku,
          title: row.product.title,
          unit: row.product.unit,
          priceTenge: row.product.companyPriceTenge ?? row.product.price,
        },
        row.qty
      );
    }
    toast.success(
      `${found.length} ${found.length === 1 ? "позиция добавлена" : "позиций добавлено"} в корзину`
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div>
          <label htmlFor="sku-list" className="text-sm font-medium text-primary">
            Артикулы и количество — по одной позиции на строку
          </label>
          <Textarea
            id="sku-list"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={10}
            className="mt-2 font-mono"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Формат: артикул и количество через пробел, запятую или табуляцию. Количество можно не
            указывать — тогда будет добавлена 1 штука.
          </p>
        </div>
        <Button onClick={handleSearch} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Search />}
          Найти товары
        </Button>

        {searched && (
          <div className="mt-6">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ничего не найдено.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Артикул</TableHead>
                    <TableHead>Товар</TableHead>
                    <TableHead>Кол-во</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.sku}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.sku}
                      </TableCell>
                      <TableCell>
                        {row.product ? (
                          <Link
                            href={`/catalog/${row.product.slug}`}
                            className="font-medium text-primary hover:text-signal-700"
                          >
                            {row.product.title}
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm text-red-600">
                            <XCircle className="size-4" />
                            Не найден в каталоге
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.product && (
                          <QuantityInput
                            value={row.qty}
                            onChange={(qty) => setQty(row.sku, qty)}
                            unit={row.product.unit}
                            size="sm"
                          />
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {row.product?.price != null
                          ? formatTenge(row.product.price)
                          : row.product
                            ? "по запросу"
                            : "—"}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => removeRow(row.sku)}
                          aria-label="Удалить строку"
                          className="text-muted-foreground hover:text-red-600"
                        >
                          <XCircle className="size-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24 lg:self-start">
        <h2 className="font-display text-lg font-semibold text-primary">Итог</h2>
        {searched ? (
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="size-4" />
              Найдено: <span className="font-semibold">{found.length}</span>
            </p>
            {notFound.length > 0 && (
              <p className="flex items-center gap-1.5 text-red-600">
                <XCircle className="size-4" />
                Не найдено: <span className="font-semibold">{notFound.length}</span>
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Вставьте список артикулов слева и нажмите «Найти товары».
          </p>
        )}
        <Button
          variant="signal"
          size="lg"
          className="mt-5 w-full"
          disabled={found.length === 0}
          onClick={addAllToCart}
        >
          <ShoppingCart />
          Добавить в корзину{found.length > 0 ? ` (${found.length})` : ""}
        </Button>
      </div>
    </div>
  );
}
