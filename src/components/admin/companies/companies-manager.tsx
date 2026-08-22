"use client";

import Link from "next/link";

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
import { CompanyForm, type CompanyRow } from "@/components/admin/companies/company-form";
import { deleteCompany } from "@/server/actions/admin";

export interface CompanyListRow extends CompanyRow {
  memberCount: number;
}

export function CompaniesManager({ rows }: { rows: CompanyListRow[] }) {
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
  } = useCrudManager<CompanyListRow, CompanyRow>(rows, (r) => `${r.name} ${r.bin ?? ""}`);

  return (
    <div className="space-y-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        onAdd={openCreate}
        addLabel="Добавить компанию"
        placeholder="Поиск по названию или БИН…"
        count={rows.length}
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>БИН</TableHead>
              <TableHead>Контакты</TableHead>
              <TableHead className="text-center">Сотрудники</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    href={`/admin/companies/${row.id}`}
                    className="font-medium text-primary hover:text-signal-700 hover:underline"
                  >
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">{row.bin ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.phone || row.email || "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="muted">{row.memberCount}</Badge>
                </TableCell>
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
        title={editing ? "Редактировать компанию" : "Новая компания"}
      >
        <CompanyForm initial={editing} onDone={closeForm} />
      </FormDialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={closeDelete}
        description={
          deleting ? `Компания «${deleting.name}» и связи с сотрудниками будут удалены.` : ""
        }
        action={() => deleteCompany(deleting!.id)}
      />
    </div>
  );
}
