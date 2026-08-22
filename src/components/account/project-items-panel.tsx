"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AddProjectItem } from "@/components/account/add-project-item";
import { updateProjectItemQty, removeProjectItem } from "@/server/actions/project-actions";
import { tiynToTenge, formatTenge } from "@/lib/money";

export interface ProjectItemRow {
  id: string;
  productId: string | null;
  slug: string | null;
  sku: string | null;
  title: string;
  qty: number;
  unit: string;
  amountTiyn: number | null;
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
              <div
                key={item.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
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
