"use client";

import * as React from "react";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { cn } from "@/lib/utils";

export interface WarehouseStockRow {
  id: string;
  productId: string;
  slug: string;
  sku: string;
  title: string;
  unit: string;
  quantity: number;
  restockAt: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function WarehouseStockList({ rows }: { rows: WarehouseStockRow[] }) {
  const [query, setQuery] = React.useState("");

  const filtered = rows.filter((r) =>
    `${r.title} ${r.sku}`.toLowerCase().includes(query.toLowerCase().trim())
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Поиск по названию или артикулу…"
        count={rows.length}
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Товар</TableHead>
              <TableHead>Артикул</TableHead>
              <TableHead className="text-right">Остаток</TableHead>
              <TableHead>Пополнение</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    href={`/admin/products?q=${encodeURIComponent(row.sku)}`}
                    className="font-medium text-primary hover:text-signal-700 hover:underline"
                  >
                    {row.title}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{row.sku}</TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    row.quantity > 0 ? "text-primary" : "text-red-600"
                  )}
                >
                  {row.quantity} {row.unit}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.restockAt ? formatDate(row.restockAt) : "—"}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {rows.length === 0 ? "На складе нет позиций." : "Ничего не найдено."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
