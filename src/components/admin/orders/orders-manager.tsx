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
import { orderStatusMeta } from "@/config/order-meta";
import { formatTiyn } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface OrderListRow {
  id: string;
  number: string;
  status: string;
  trackingNumber: string | null;
  itemCount: number;
  totalTiyn: number;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function OrdersManager({ rows }: { rows: OrderListRow[] }) {
  const [query, setQuery] = React.useState("");

  const filtered = rows.filter((r) =>
    `${r.number} ${r.trackingNumber ?? ""}`.toLowerCase().includes(query.toLowerCase().trim())
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Поиск по номеру заказа или трек-номеру…"
        count={rows.length}
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Номер</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Позиции</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const meta = orderStatusMeta[row.status] ?? orderStatusMeta.NEW;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${row.id}`}
                      className="font-mono font-medium text-primary hover:text-signal-700 hover:underline"
                    >
                      {row.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        meta.className
                      )}
                    >
                      {meta.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.itemCount} поз.</TableCell>
                  <TableCell className="font-medium text-primary">
                    {row.totalTiyn > 0 ? formatTiyn(row.totalTiyn) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Заказов не найдено.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
