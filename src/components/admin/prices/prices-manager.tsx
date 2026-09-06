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
import { PriceForm, type PriceRow } from "@/components/admin/prices/price-form";
import { deletePrice } from "@/server/actions/admin";
import { formatTengePerUnit } from "@/lib/money";

export interface PriceListRow extends PriceRow {
  productTitle: string;
  productSku: string;
  unit: string;
}

interface Ref {
  id: string;
  label: string;
}

const kindMeta: Record<string, { label: string; variant: "muted" | "signal" | "stock" }> = {
  BASE: { label: "Базовая", variant: "muted" },
  WHOLESALE: { label: "Оптовая", variant: "signal" },
  PROMO: { label: "Акция", variant: "stock" },
};

export function PricesManager({ rows, products }: { rows: PriceListRow[]; products: Ref[] }) {
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
  } = useCrudManager<PriceListRow, PriceRow>(rows, (r) => `${r.productTitle} ${r.productSku}`);

  return (
    <div className="space-y-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        onAdd={openCreate}
        addLabel="Добавить цену"
        placeholder="Поиск по товару или SKU…"
        count={rows.length}
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Товар</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead className="text-right">Цена</TableHead>
              <TableHead className="text-center">От кол-ва</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const meta = kindMeta[row.kind] ?? kindMeta.BASE;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium text-primary">{row.productTitle}</div>
                    <div className="font-mono text-xs text-muted-foreground">{row.productSku}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    {row.amountTenge === "" ? (
                      <span className="text-muted-foreground">по запросу</span>
                    ) : (
                      <>{formatTengePerUnit(Number(row.amountTenge), row.unit)}</>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">{row.minQty}</TableCell>
                  <TableCell>
                    <RowActions onEdit={() => openEdit(row)} onDelete={() => setDeleting(row)} />
                  </TableCell>
                </TableRow>
              );
            })}
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
        title={editing ? "Редактировать цену" : "Новая цена"}
      >
        <PriceForm initial={editing} products={products} onDone={closeForm} />
      </FormDialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={closeDelete}
        description={deleting ? `Цена для «${deleting.productTitle}» будет удалена.` : ""}
        action={() => deletePrice(deleting!.id)}
      />
    </div>
  );
}
