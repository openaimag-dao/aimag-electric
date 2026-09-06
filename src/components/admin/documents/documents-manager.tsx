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
import { DocumentForm, type DocumentRow } from "@/components/admin/documents/document-form";
import { deleteDocument } from "@/server/actions/admin";

export interface DocumentListRow extends DocumentRow {
  productTitle: string;
  productSku: string;
}

interface Ref {
  id: string;
  label: string;
}

const kindMeta: Record<string, string> = {
  DATASHEET: "Паспорт",
  CERTIFICATE: "Сертификат",
  MANUAL: "Инструкция",
  DRAWING: "Чертёж",
};

export function DocumentsManager({ rows, products }: { rows: DocumentListRow[]; products: Ref[] }) {
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
  } = useCrudManager<DocumentListRow, DocumentRow>(
    rows,
    (r) => `${r.title} ${r.productTitle} ${r.productSku}`
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        onAdd={openCreate}
        addLabel="Добавить документ"
        placeholder="Поиск по названию или товару…"
        count={rows.length}
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Документ</TableHead>
              <TableHead>Товар</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Размер</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <a
                    href={row.url}
                    className="font-medium text-primary hover:text-signal-700"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {row.title}
                  </a>
                  <div className="font-mono text-xs text-muted-foreground">{row.url}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.productTitle}</TableCell>
                <TableCell>
                  <Badge variant="muted">{kindMeta[row.kind] ?? row.kind}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.size ?? "—"}</TableCell>
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
        title={editing ? "Редактировать документ" : "Новый документ"}
      >
        <DocumentForm initial={editing} products={products} onDone={closeForm} />
      </FormDialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={closeDelete}
        description={deleting ? `Документ «${deleting.title}» будет удалён.` : ""}
        action={() => deleteDocument(deleting!.id)}
      />
    </div>
  );
}
