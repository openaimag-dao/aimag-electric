"use client";

import { useCrudManager } from "@/hooks/use-crud-manager";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { RowActions } from "@/components/admin/row-actions";
import { FormDialog } from "@/components/admin/form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ProductForm, type ProductRow } from "@/components/admin/products/product-form";
import { deleteProduct } from "@/server/actions/admin";

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
}: {
  rows: ProductListRow[];
  categories: Ref[];
  brands: Ref[];
}) {
  const {
    query,
    setQuery,
    filtered,
    formOpen,
    setFormOpen,
    editing,
    openCreate,
    openEdit,
    closeForm,
    deleting,
    setDeleting,
    closeDelete,
  } = useCrudManager<ProductListRow, ProductRow>(
    rows,
    (r) => `${r.title} ${r.sku} ${r.brandName} ${r.categoryTitle}`
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        onAdd={openCreate}
        addLabel="Добавить товар"
        placeholder="Поиск по названию, SKU, бренду…"
        count={rows.length}
      />

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
            {filtered.map((row) => {
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
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${av.className}`}>
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
                    <RowActions
                      onEdit={() => openEdit(row)}
                      onDelete={() => setDeleting(row)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Ничего не найдено.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Редактировать товар" : "Новый товар"}
        description="Характеристики, документы и остатки редактируются в соответствующих разделах."
      >
        <ProductForm
          initial={editing}
          categories={categories}
          brands={brands}
          onDone={closeForm}
        />
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
