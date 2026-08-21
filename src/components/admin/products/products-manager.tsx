"use client";

import * as React from "react";
import { Search, Plus } from "lucide-react";

import { useCrudManager } from "@/hooks/use-crud-manager";
import { useAdminProductsFilters } from "@/hooks/use-admin-products-filters";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/admin/form-fields";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { RowActions } from "@/components/admin/row-actions";
import { FormDialog } from "@/components/admin/form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ProductForm, type ProductRow } from "@/components/admin/products/product-form";
import { deleteProduct } from "@/server/actions/admin";
import { QUALITY_FILTERS, QUALITY_FILTER_LABELS } from "@/lib/admin/product-quality";

export interface ProductListRow extends ProductRow {
  categoryTitle: string;
  brandName: string;
  priceLabel: string;
  availability: "in_stock" | "on_order" | "out";
}

interface Ref {
  id: string;
  label: string;
}

const availabilityMeta: Record<string, { label: string; className: string }> = {
  in_stock: { label: "В наличии", className: "bg-emerald-50 text-emerald-700" },
  on_order: { label: "Под заказ", className: "bg-amber-50 text-amber-700" },
  out: { label: "Нет", className: "bg-secondary text-muted-foreground" },
};

export function ProductsManager({
  rows,
  categories,
  brands,
  total,
  page,
  pageCount,
}: {
  rows: ProductListRow[];
  categories: Ref[];
  brands: Ref[];
  total: number;
  page: number;
  pageCount: number;
}) {
  const {
    formOpen,
    setFormOpen,
    editing,
    openCreate,
    openEdit,
    closeForm,
    deleting,
    setDeleting,
    closeDelete,
  } = useCrudManager<ProductListRow, ProductRow>(rows, (r) => `${r.title} ${r.sku}`);

  const { query, update } = useAdminProductsFilters();

  // Search box is debounced against the URL — typing shouldn't navigate on every keystroke.
  const [searchInput, setSearchInput] = React.useState(query.q);
  React.useEffect(() => setSearchInput(query.q), [query.q]);
  React.useEffect(() => {
    if (searchInput === query.q) return;
    const t = setTimeout(() => update({ q: searchInput }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on searchInput changes; `update`/`query.q` would cause an extra debounce cycle
  }, [searchInput]);

  const activeQualityCount = query.quality ? 1 : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по названию, SKU…"
            className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm shadow-sm focus-visible:border-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <NativeSelect
          value={query.category}
          onChange={(e) => update({ category: e.target.value })}
          className="h-10 w-auto"
        >
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          value={query.brand}
          onChange={(e) => update({ brand: e.target.value })}
          className="h-10 w-auto"
        >
          <option value="">Все производители</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          value={query.status}
          onChange={(e) => update({ status: e.target.value as "" | "published" | "hidden" })}
          className="h-10 w-auto"
        >
          <option value="">Любой статус</option>
          <option value="published">Опубликован</option>
          <option value="hidden">Скрыт</option>
        </NativeSelect>

        <NativeSelect
          value={query.quality}
          onChange={(e) => update({ quality: e.target.value as typeof query.quality })}
          className={activeQualityCount ? "h-10 w-auto border-signal" : "h-10 w-auto"}
        >
          <option value="">Качество: все</option>
          {QUALITY_FILTERS.map((f) => (
            <option key={f} value={f}>
              {QUALITY_FILTER_LABELS[f]}
            </option>
          ))}
        </NativeSelect>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Всего: {total}</span>
          <Button onClick={openCreate} variant="signal">
            <Plus />
            Добавить товар
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Товар</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Производитель</TableHead>
              <TableHead className="text-right">Цена</TableHead>
              <TableHead className="text-center">Наличие</TableHead>
              <TableHead className="text-center">Статус</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const av = availabilityMeta[row.availability];
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium text-primary">{row.title}</div>
                    <div className="font-mono text-xs text-muted-foreground">{row.sku}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.categoryTitle}</TableCell>
                  <TableCell className="text-muted-foreground">{row.brandName}</TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    {row.priceLabel}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${av.className}`}
                    >
                      {av.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {row.published ? (
                      <Badge variant="stock">Опубликован</Badge>
                    ) : (
                      <Badge variant="out">Скрыт</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <RowActions onEdit={() => openEdit(row)} onDelete={() => setDeleting(row)} />
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Ничего не найдено.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AdminPagination
        page={page}
        pageCount={pageCount}
        onPageChange={(p) => update({ page: p }, { keepPage: true })}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Редактировать товар" : "Новый товар"}
        description="Характеристики и остатки редактируются в соответствующих разделах."
      >
        <ProductForm initial={editing} categories={categories} brands={brands} onDone={closeForm} />
      </FormDialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={closeDelete}
        description={
          deleting
            ? `Товар «${deleting.title}» со всеми ценами, остатками и документами будет удалён.`
            : ""
        }
        action={() => deleteProduct(deleting!.id)}
      />
    </div>
  );
}
