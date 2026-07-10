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
import { TableToolbar } from "@/components/admin/table-toolbar";
import { RowActions } from "@/components/admin/row-actions";
import { FormDialog } from "@/components/admin/form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { BrandForm, type BrandRow } from "@/components/admin/brands/brand-form";
import { deleteBrand } from "@/server/actions/admin";

export interface BrandListRow extends BrandRow {
  productCount: number;
}

export function BrandsManager({ rows }: { rows: BrandListRow[] }) {
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
  } = useCrudManager<BrandListRow, BrandRow>(
    rows,
    (r) => `${r.name} ${r.slug} ${r.origin ?? ""}`
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        onAdd={openCreate}
        addLabel="Добавить производителя"
        placeholder="Поиск по названию…"
        count={rows.length}
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Происхождение</TableHead>
              <TableHead className="text-center">Товаров</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium text-primary">{row.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {row.slug}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.origin ?? "—"}
                </TableCell>
                <TableCell className="text-center">{row.productCount}</TableCell>
                <TableCell>
                  <RowActions
                    onEdit={() => openEdit(row)}
                    onDelete={() => setDeleting(row)}
                  />
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
        title={editing ? "Редактировать производителя" : "Новый производитель"}
      >
        <BrandForm initial={editing} onDone={closeForm} />
      </FormDialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={closeDelete}
        description={
          deleting ? `Производитель «${deleting.name}» будет удалён.` : ""
        }
        action={() => deleteBrand(deleting!.id)}
      />
    </div>
  );
}
