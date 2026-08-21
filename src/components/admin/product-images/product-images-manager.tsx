"use client";

import { ImageOff } from "lucide-react";

import { useCrudManager } from "@/hooks/use-crud-manager";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { RowActions } from "@/components/admin/row-actions";
import { FormDialog } from "@/components/admin/form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import {
  ProductImageForm,
  type ProductImageRow,
} from "@/components/admin/product-images/product-image-form";
import { deleteProductImage } from "@/server/actions/admin";

export interface ProductImageListRow extends ProductImageRow {
  productTitle: string;
  productSku: string;
}

interface Ref {
  id: string;
  label: string;
}

export function ProductImagesManager({
  rows,
  products,
}: {
  rows: ProductImageListRow[];
  products: Ref[];
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
  } = useCrudManager<ProductImageListRow, ProductImageRow>(
    rows,
    (r) => `${r.productTitle} ${r.productSku}`
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        onAdd={openCreate}
        addLabel="Добавить фото"
        placeholder="Поиск по товару…"
        count={rows.length}
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Фото</TableHead>
              <TableHead>Товар</TableHead>
              <TableHead>Ссылка</TableHead>
              <TableHead className="text-center">Порядок</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, admin thumbnail only */}
                  <img
                    src={row.url}
                    alt={row.alt ?? ""}
                    className="size-12 rounded-md border border-border object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                  <div className="hidden size-12 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                    <ImageOff className="size-4" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-primary">{row.productTitle}</div>
                  <div className="font-mono text-xs text-muted-foreground">{row.productSku}</div>
                </TableCell>
                <TableCell className="max-w-xs truncate font-mono text-xs text-muted-foreground">
                  {row.url}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">{row.order}</TableCell>
                <TableCell>
                  <RowActions onEdit={() => openEdit(row)} onDelete={() => setDeleting(row)} />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
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
        title={editing ? "Редактировать фото" : "Новое фото"}
      >
        <ProductImageForm initial={editing} products={products} onDone={closeForm} />
      </FormDialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={closeDelete}
        description={deleting ? `Фото товара «${deleting.productTitle}» будет удалено.` : ""}
        action={() => deleteProductImage(deleting!.id)}
      />
    </div>
  );
}
