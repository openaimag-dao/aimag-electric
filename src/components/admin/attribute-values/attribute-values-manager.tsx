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
import {
  AttributeValueForm,
  type AttributeValueRow,
} from "@/components/admin/attribute-values/attribute-value-form";
import { deleteAttributeValue } from "@/server/actions/admin";

export interface AttributeValueListRow extends AttributeValueRow {
  productTitle: string;
  productSku: string;
  attributeName: string;
  attributeUnit: string | null;
}

interface ProductRef {
  id: string;
  label: string;
}

interface AttributeRef {
  id: string;
  label: string;
  unit: string | null;
}

export function AttributeValuesManager({
  rows,
  products,
  attributes,
}: {
  rows: AttributeValueListRow[];
  products: ProductRef[];
  attributes: AttributeRef[];
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
  } = useCrudManager<AttributeValueListRow, AttributeValueRow>(
    rows,
    (r) => `${r.productTitle} ${r.productSku} ${r.attributeName}`
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        onAdd={openCreate}
        addLabel="Добавить значение"
        placeholder="Поиск по товару, SKU или характеристике…"
        count={rows.length}
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Товар</TableHead>
              <TableHead>Характеристика</TableHead>
              <TableHead>Значение</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="font-medium text-primary">{row.productTitle}</div>
                  <div className="font-mono text-xs text-muted-foreground">{row.productSku}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.attributeName}</TableCell>
                <TableCell className="font-medium text-primary">
                  {row.value}
                  {row.attributeUnit ? ` ${row.attributeUnit}` : ""}
                </TableCell>
                <TableCell>
                  <RowActions onEdit={() => openEdit(row)} onDelete={() => setDeleting(row)} />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
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
        title={editing ? "Редактировать значение" : "Новое значение"}
      >
        <AttributeValueForm
          initial={editing}
          products={products}
          attributes={attributes}
          onDone={closeForm}
        />
      </FormDialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={closeDelete}
        description={
          deleting
            ? `Значение «${deleting.attributeName}» для «${deleting.productTitle}» будет удалено.`
            : ""
        }
        action={() => deleteAttributeValue(deleting!.id)}
      />
    </div>
  );
}
