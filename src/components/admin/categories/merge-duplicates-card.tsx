"use client";

import * as React from "react";
import { Loader2, Merge } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { mergedCategorySlugs } from "@/config/category-merges";
import { mergeDuplicateCategories } from "@/server/actions/admin";
import type { CategoryListRow } from "@/components/admin/categories/categories-manager";

interface PendingMerge {
  oldCat: CategoryListRow;
  newCat: CategoryListRow;
}

/**
 * Surfaces the leftover-duplicate-category cleanup (see category-merges.ts)
 * only while it's still needed — pending merges are derived straight from
 * the rows already on the page, so once mergeDuplicateCategories runs and
 * the old categories are gone, this card stops rendering on its own with
 * no separate "is this done yet" state to track.
 */
export function MergeDuplicatesCard({ rows }: { rows: CategoryListRow[] }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const pendingMerges: PendingMerge[] = Object.entries(mergedCategorySlugs)
    .map(([oldSlug, newSlug]) => {
      const oldCat = bySlug.get(oldSlug);
      const newCat = bySlug.get(newSlug);
      return oldCat && newCat ? { oldCat, newCat } : null;
    })
    .filter((m): m is PendingMerge => m !== null);

  if (pendingMerges.length === 0) return null;

  const totalProducts = pendingMerges.reduce((sum, m) => sum + m.oldCat.productCount, 0);

  async function handleConfirm() {
    setPending(true);
    const result = await mergeDuplicateCategories();
    setPending(false);
    if (result.ok) {
      toast.success(
        `Объединено категорий: ${result.data?.merged ?? pendingMerges.length}, перенесено товаров: ${result.data?.productsMoved ?? totalProducts}`
      );
      setOpen(false);
    } else {
      toast.error(result.error ?? "Не удалось объединить категории");
    }
  }

  return (
    <div className="rounded-xl border border-signal/40 bg-signal/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-primary">Найдены дублирующиеся категории</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Остались от прежней консолидации SEO-контента — товары стоит перенести в категории
            справа, а пустые слева удалить.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {pendingMerges.map((m) => (
              <li key={m.oldCat.id}>
                «{m.oldCat.title}» ({m.oldCat.productCount} тов.) → «{m.newCat.title}»
              </li>
            ))}
          </ul>
        </div>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="signal" size="sm">
              <Merge />
              Объединить
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Объединить дублирующиеся категории?</AlertDialogTitle>
              <AlertDialogDescription>
                {totalProducts} товар(ов) будут перенесены в категории, указанные справа выше, а{" "}
                {pendingMerges.length} опустевшие категории — удалены. Действие необратимо.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleConfirm();
                }}
                disabled={pending}
              >
                {pending && <Loader2 className="animate-spin" />}
                Объединить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
