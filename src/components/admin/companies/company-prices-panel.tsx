"use client";

import * as React from "react";
import { Loader2, Trash2, Plus, Check, X, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/admin/form-fields";
import { createCompanyPrice, updateCompanyPrice, deleteCompanyPrice } from "@/server/actions/admin";
import { formatTenge } from "@/lib/money";

export interface CompanyPriceRow {
  id: string;
  productId: string;
  amountTenge: number;
  product: { title: string; sku: string; unit: string };
}

export interface ProductOption {
  id: string;
  label: string;
}

export function CompanyPricesPanel({
  companyId,
  initialPrices,
  products,
}: {
  companyId: string;
  initialPrices: CompanyPriceRow[];
  /** Products without a reference price yet for this company — candidates for "add price". */
  products: ProductOption[];
}) {
  const [prices, setPrices] = React.useState(initialPrices);
  const [selectedProductId, setSelectedProductId] = React.useState("");
  const [newPriceDraft, setNewPriceDraft] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState("");
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const pricedProductIds = new Set(prices.map((p) => p.productId));
  const availableProducts = products.filter((p) => !pricedProductIds.has(p.id));

  function parsePrice(raw: string): number | null {
    const n = Number(raw.trim().replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  }

  async function handleAdd() {
    const priceTenge = parsePrice(newPriceDraft);
    if (!selectedProductId || priceTenge === null) {
      toast.error("Укажите товар и корректную цену");
      return;
    }
    setAdding(true);
    const result = await createCompanyPrice(companyId, selectedProductId, priceTenge);
    setAdding(false);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось добавить цену");
      return;
    }
    const product = products.find((p) => p.id === selectedProductId);
    const [title, sku] = product ? splitLabel(product.label) : ["", ""];
    setPrices((prev) => [
      {
        id: crypto.randomUUID(),
        productId: selectedProductId,
        amountTenge: priceTenge,
        product: { title, sku, unit: "шт" },
      },
      ...prev,
    ]);
    setSelectedProductId("");
    setNewPriceDraft("");
    toast.success("Цена добавлена");
  }

  function startEdit(row: CompanyPriceRow) {
    setEditingId(row.id);
    setEditDraft(String(row.amountTenge));
  }

  async function handleSaveEdit(id: string) {
    const priceTenge = parsePrice(editDraft);
    if (priceTenge === null) {
      toast.error("Некорректная цена");
      return;
    }
    setSavingId(id);
    const result = await updateCompanyPrice(id, companyId, priceTenge);
    setSavingId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось изменить цену");
      return;
    }
    setPrices((prev) => prev.map((p) => (p.id === id ? { ...p, amountTenge: priceTenge } : p)));
    setEditingId(null);
    toast.success("Цена обновлена");
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    const result = await deleteCompanyPrice(id, companyId);
    setRemovingId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось удалить цену");
      return;
    }
    setPrices((prev) => prev.filter((p) => p.id !== id));
    toast.success("Цена удалена");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card">
        {prices.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Для этой компании ещё не заданы договорные цены. Они появляются как подсказка при
            выставлении цены в КП, но не подставляются автоматически.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {prices.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-primary">{p.product.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.product.sku}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {editingId === p.id ? (
                    <>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        autoFocus
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(p.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        disabled={savingId === p.id}
                        className="w-24 rounded border border-input px-1.5 py-0.5 text-right text-xs"
                      />
                      <button
                        type="button"
                        aria-label="Сохранить"
                        onClick={() => handleSaveEdit(p.id)}
                        disabled={savingId === p.id}
                        className="hover:text-signal-800 text-signal-700 disabled:opacity-50"
                      >
                        {savingId === p.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label="Отменить"
                        onClick={() => setEditingId(null)}
                        disabled={savingId === p.id}
                        className="text-muted-foreground hover:text-red-600 disabled:opacity-50"
                      >
                        <X className="size-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-signal-700 hover:underline"
                    >
                      {formatTenge(p.amountTenge)}
                      <Pencil className="size-3 text-muted-foreground" />
                    </button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-red-600"
                    onClick={() => handleRemove(p.id)}
                    disabled={removingId === p.id}
                    aria-label="Удалить цену"
                  >
                    {removingId === p.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-border p-3">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Товар</label>
          <NativeSelect
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">— выберите товар —</option>
            {availableProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="w-36">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Цена, ₸</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={newPriceDraft}
            onChange={(e) => setNewPriceDraft(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <Button
          type="button"
          variant="signal"
          onClick={handleAdd}
          disabled={adding || !selectedProductId || !newPriceDraft}
        >
          {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Добавить
        </Button>
      </div>

      {availableProducts.length === 0 && prices.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Для всех товаров каталога уже задана цена этой компании.
        </p>
      )}
    </div>
  );
}

/** Splits the "Title (SKU)" label built in the page into its parts for optimistic local state. */
function splitLabel(label: string): [string, string] {
  const match = label.match(/^(.*) \(([^)]*)\)$/);
  return match ? [match[1], match[2]] : [label, ""];
}
