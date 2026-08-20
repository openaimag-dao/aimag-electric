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
import { AttributeForm, type AttributeRow } from "@/components/admin/attributes/attribute-form";
import { deleteAttribute } from "@/server/actions/admin";

const typeLabels: Record<AttributeRow["type"], string> = {
  STRING: "Текст",
  NUMBER: "Число",
  BOOLEAN: "Да/Нет",
};

export interface AttributeListRow extends AttributeRow {
  valueCount: number;
}

export function AttributesManager({ rows }: { rows: AttributeListRow[] }) {
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
  } = useCrudManager<AttributeListRow, AttributeRow>(rows, (r) => `${r.name} ${r.key}`);

  return (
    <div className="space-y-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        onAdd={openCreate}
        addLabel="Добавить характеристику"
        placeholder="Поиск по названию или ключу…"
        count={rows.length}
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Ключ</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Единица</TableHead>
              <TableHead className="text-center">В фильтрах</TableHead>
              <TableHead className="text-center">Значений</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium text-primary">{row.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{row.key}</TableCell>
                <TableCell className="text-muted-foreground">{typeLabels[row.type]}</TableCell>
                <TableCell className="text-muted-foreground">{row.unit ?? "—"}</TableCell>
                <TableCell className="text-center">
                  {row.filterable ? (
                    <Badge variant="stock">Да</Badge>
                  ) : (
                    <Badge variant="muted">Нет</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">{row.valueCount}</TableCell>
                <TableCell>
                  <RowActions onEdit={() => openEdit(row)} onDelete={() => setDeleting(row)} />
                </TableCell>
              </TableRow>
            ))}
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
        title={editing ? "Редактировать характеристику" : "Новая характеристика"}
        description="Значения по товарам задаются отдельно, в разделе «Значения характеристик»."
      >
        <AttributeForm initial={editing} onDone={closeForm} />
      </FormDialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={closeDelete}
        description={
          deleting
            ? `Характеристика «${deleting.name}» будет удалена без возможности восстановления.`
            : ""
        }
        action={() => deleteAttribute(deleting!.id)}
      />
    </div>
  );
}
