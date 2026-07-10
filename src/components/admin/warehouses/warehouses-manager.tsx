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
import { WarehouseForm, type WarehouseRow } from "@/components/admin/warehouses/warehouse-form";
import { deleteWarehouse } from "@/server/actions/admin";

export interface WarehouseListRow extends WarehouseRow {
  stockCount: number;
}

export function WarehousesManager({ rows }: { rows: WarehouseListRow[] }) {
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
  } = useCrudManager<WarehouseListRow, WarehouseRow>(
    rows,
    (r) => `${r.name} ${r.code} ${r.city}`
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        onAdd={openCreate}
        addLabel="Добавить склад"
        placeholder="Поиск по названию или городу…"
        count={rows.length}
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Код</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Город</TableHead>
              <TableHead className="text-center">Позиций на складе</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Badge variant="muted" className="font-mono">{row.code}</Badge>
                </TableCell>
                <TableCell className="font-medium text-primary">{row.name}</TableCell>
                <TableCell className="text-muted-foreground">{row.city}</TableCell>
                <TableCell className="text-center">{row.stockCount}</TableCell>
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
        title={editing ? "Редактировать склад" : "Новый склад"}
      >
        <WarehouseForm initial={editing} onDone={closeForm} />
      </FormDialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={closeDelete}
        description={
          deleting
            ? `Склад «${deleting.name}» и связанные остатки будут удалены.`
            : ""
        }
        action={() => deleteWarehouse(deleting!.id)}
      />
    </div>
  );
}
