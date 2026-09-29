"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { FormDialog } from "@/components/admin/form-dialog";
import { PriceForm, type PriceRow } from "@/components/admin/prices/price-form";
import { Button } from "@/components/ui/button";
import { formatTengePerUnit } from "@/lib/money";

export interface WarehousePriceRow extends PriceRow {
  status: string;
}

const kindLabels: Record<string, string> = {
  BASE: "Базовая",
  WHOLESALE: "Оптовая",
  PROMO: "Акция",
};

export function WarehousePriceCell({
  productId,
  title,
  sku,
  unit,
  prices,
}: {
  productId: string;
  title: string;
  sku: string;
  unit: string;
  prices: WarehousePriceRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PriceRow | undefined>();

  return (
    <div className="min-w-48 space-y-2">
      {prices.length === 0 && <p className="text-sm text-muted-foreground">Цена не задана</p>}
      {prices.map((price) => (
        <button
          key={price.id}
          type="button"
          aria-label={`Изменить цену: ${kindLabels[price.kind] ?? price.kind}, от ${price.minQty} ${unit}`}
          className="block w-full rounded-md px-2 py-1 text-left hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => {
            setEditing(price);
            setOpen(true);
          }}
        >
          <span className="flex items-center gap-2 font-medium text-primary">
            {price.amountTenge === "" ? "По запросу" : formatTengePerUnit(price.amountTenge, unit)}
            <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
          </span>
          <span className="text-xs text-muted-foreground">
            {kindLabels[price.kind] ?? price.kind} · от {price.minQty} {unit} · {price.status}
          </span>
        </button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setEditing(undefined);
          setOpen(true);
        }}
      >
        <Plus className="size-3.5" /> Добавить цену
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Редактировать цену товара" : "Добавить цену товара"}
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Цена товара общая для всех складов. Остаток не изменится.
        </p>
        <PriceForm
          key={editing?.id ?? "new"}
          initial={editing}
          defaultProductId={productId}
          products={[{ id: productId, label: `${title} · ${sku}` }]}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </FormDialog>
    </div>
  );
}
