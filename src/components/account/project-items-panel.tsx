"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, Minus, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AddProjectItem } from "@/components/account/add-project-item";
import { AvailabilityBadge } from "@/components/catalog/availability-badge";
import {
  updateProjectItemQty,
  removeProjectItem,
  addProjectItem,
} from "@/server/actions/project-actions";
import { getProductAlternatives } from "@/server/actions/product-lookup-actions";
import { tiynToTenge, formatTenge } from "@/lib/money";
import type { CatalogProduct } from "@/types/catalog";

export interface ProjectItemRow {
  id: string;
  productId: string | null;
  slug: string | null;
  sku: string | null;
  title: string;
  qty: number;
  unit: string;
  amountTiyn: number | null;
  note?: string | null;
}

export function ProjectItemsPanel({
  projectId,
  items,
  editable,
}: {
  projectId: string;
  items: ProjectItemRow[];
  /** false for VIEWER-role company members — read-only. */
  editable: boolean;
}) {
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [openAlternativesId, setOpenAlternativesId] = React.useState<string | null>(null);
  const [alternatives, setAlternatives] = React.useState<Record<string, CatalogProduct[]>>({});
  const [loadingAlternativesId, setLoadingAlternativesId] = React.useState<string | null>(null);
  const [addingAlternativeId, setAddingAlternativeId] = React.useState<string | null>(null);

  async function toggleAlternatives(item: ProjectItemRow) {
    if (openAlternativesId === item.id) {
      setOpenAlternativesId(null);
      return;
    }
    setOpenAlternativesId(item.id);
    if (alternatives[item.id] || !item.productId) return;
    setLoadingAlternativesId(item.id);
    const found = await getProductAlternatives(item.productId);
    setLoadingAlternativesId(null);
    setAlternatives((prev) => ({ ...prev, [item.id]: found }));
  }

  async function handleAddAlternative(product: CatalogProduct) {
    setAddingAlternativeId(product.id);
    const result = await addProjectItem(projectId, {
      productId: product.id,
      slug: product.slug,
      sku: product.sku,
      title: product.title,
      qty: 1,
      unit: product.unit,
      priceTenge: product.companyPriceTenge ?? product.price,
    });
    setAddingAlternativeId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось добавить товар");
      return;
    }
    toast.success("Аналог добавлен в проект");
  }

  async function handleQty(itemId: string, qty: number) {
    if (qty <= 0) return;
    setBusyId(itemId);
    const result = await updateProjectItemQty(projectId, itemId, qty);
    setBusyId(null);
    if (!result.ok) toast.error(result.error ?? "Не удалось изменить количество");
  }

  async function handleRemove(itemId: string) {
    setBusyId(itemId);
    const result = await removeProjectItem(projectId, itemId);
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось удалить позицию");
      return;
    }
    toast.success("Позиция удалена");
  }

  const total = items.reduce((sum, i) => sum + (i.amountTiyn ?? 0) * i.qty, 0);
  const hasUnpriced = items.some((i) => i.amountTiyn === null);

  return (
    <div className="space-y-4">
      {editable && <AddProjectItem projectId={projectId} />}

      <div className="rounded-xl border border-border bg-card">
        {items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">В проекте пока нет позиций.</p>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    {item.slug ? (
                      <Link
                        href={`/catalog/${item.slug}`}
                        className="font-medium text-primary hover:text-signal-700"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <p className="font-medium text-primary">{item.title}</p>
                    )}
                    {item.sku && (
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        Арт. {item.sku}
                      </p>
                    )}
                    {item.productId && (
                      <button
                        type="button"
                        onClick={() => toggleAlternatives(item)}
                        className="mt-1 inline-flex items-center gap-1 text-xs text-steel-600 hover:text-signal-700"
                      >
                        <Search className="size-3" />
                        Найти аналог
                      </button>
                    )}
                    {item.note && (
                      <p className="mt-1 flex items-start gap-1 text-xs text-amber-700">
                        <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                        {item.note}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {editable ? (
                      <div className="flex items-center gap-1.5 rounded-md border border-border">
                        <button
                          type="button"
                          aria-label="Уменьшить количество"
                          className="flex size-8 items-center justify-center text-steel-600 hover:text-primary disabled:opacity-50"
                          onClick={() => handleQty(item.id, item.qty - 1)}
                          disabled={busyId === item.id || item.qty <= 1}
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="min-w-10 text-center text-sm tabular-nums">
                          {item.qty} {item.unit}
                        </span>
                        <button
                          type="button"
                          aria-label="Увеличить количество"
                          className="flex size-8 items-center justify-center text-steel-600 hover:text-primary disabled:opacity-50"
                          onClick={() => handleQty(item.id, item.qty + 1)}
                          disabled={busyId === item.id}
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {item.qty} {item.unit}
                      </span>
                    )}

                    <span className="w-28 text-right text-sm font-semibold text-primary">
                      {item.amountTiyn !== null
                        ? formatTenge(tiynToTenge(item.amountTiyn) * item.qty)
                        : "по запросу"}
                    </span>

                    {editable && (
                      <button
                        type="button"
                        aria-label="Удалить позицию"
                        className="text-muted-foreground hover:text-red-600 disabled:opacity-50"
                        onClick={() => handleRemove(item.id)}
                        disabled={busyId === item.id}
                      >
                        {busyId === item.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {openAlternativesId === item.id && (
                  <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-3">
                    {loadingAlternativesId === item.id ? (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" /> Ищем аналоги…
                      </p>
                    ) : !alternatives[item.id]?.length ? (
                      <p className="text-sm text-muted-foreground">
                        Аналогов в этой категории не найдено.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {alternatives[item.id].map((p) => (
                          <div
                            key={p.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-card p-2"
                          >
                            <div className="min-w-0">
                              <Link
                                href={`/catalog/${p.slug}`}
                                className="text-sm font-medium text-primary hover:text-signal-700"
                              >
                                {p.title}
                              </Link>
                              <div className="mt-1 flex items-center gap-2">
                                <AvailabilityBadge status={p.availability} />
                                <span className="text-xs text-muted-foreground">
                                  {p.price !== null ? formatTenge(p.price) : "по запросу"}
                                </span>
                              </div>
                            </div>
                            {editable && (
                              <button
                                type="button"
                                onClick={() => handleAddAlternative(p)}
                                disabled={addingAlternativeId === p.id}
                                className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                              >
                                {addingAlternativeId === p.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Plus className="size-3" />
                                )}
                                Добавить
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-4">
          <span className="text-sm text-muted-foreground">
            Итого{hasUnpriced && ", часть позиций — по запросу"}
          </span>
          <span className="font-display text-xl font-bold text-primary">
            {formatTenge(tiynToTenge(total))}
          </span>
        </div>
      )}
    </div>
  );
}
