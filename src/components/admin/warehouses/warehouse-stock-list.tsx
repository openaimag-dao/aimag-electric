"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { updateStockQuantity } from "@/server/actions/admin";
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

function StockQuantityCell({
  warehouseId,
  stockId,
  quantity,
  unit,
  onSaved,
}: {
  warehouseId: string;
  stockId: string;
  quantity: number;
  unit: string;
  onSaved: (quantity: number) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(String(quantity));
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function startEdit() {
    setValue(String(quantity));
    setEditing(true);
  }

  async function save() {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Введите корректное число");
      return;
    }
    if (parsed === quantity) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const result = await updateStockQuantity(warehouseId, stockId, { quantity: parsed });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось сохранить остаток");
      return;
    }
    onSaved(parsed);
    setEditing(false);
    toast.success("Остаток обновлён");
  }

  if (editing) {
    return (
      <div className="flex items-center justify-end gap-1">
        <input
          ref={inputRef}
          type="number"
          min={0}
          step="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          disabled={saving}
          className="h-8 w-24 rounded-md border border-input bg-card px-2 text-right text-sm shadow-sm focus-visible:border-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="text-xs text-muted-foreground">{unit}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={save}
          disabled={saving}
          aria-label="Сохранить"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setEditing(false)}
          disabled={saving}
          aria-label="Отмена"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-medium hover:bg-secondary",
        quantity > 0 ? "text-primary" : "text-red-600"
      )}
    >
      {quantity} {unit}
      <Pencil className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
    </button>
  );
}

export function WarehouseStockList({
  warehouseId,
  rows,
}: {
  warehouseId: string;
  rows: WarehouseStockRow[];
}) {
  const [query, setQuery] = React.useState("");
  const [quantities, setQuantities] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, r.quantity]))
  );

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
                <TableCell className="text-right">
                  <StockQuantityCell
                    warehouseId={warehouseId}
                    stockId={row.id}
                    quantity={quantities[row.id] ?? row.quantity}
                    unit={row.unit}
                    onSaved={(quantity) =>
                      setQuantities((prev) => ({ ...prev, [row.id]: quantity }))
                    }
                  />
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
