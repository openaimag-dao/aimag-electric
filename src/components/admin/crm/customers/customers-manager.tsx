"use client";

import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { RowActions } from "@/components/admin/row-actions";
import { FormDialog } from "@/components/admin/form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { useCrudManager } from "@/hooks/use-crud-manager";
import { customerStatusMeta } from "@/config/crm-meta";
import { CustomerForm, type CustomerRow } from "@/components/admin/crm/customers/customer-form";
import { deleteCustomer } from "@/server/actions/admin";

export interface CustomerListRow extends CustomerRow {
  ownerName: string | null;
  dealCount: number;
  quoteCount: number;
  activityCount: number;
}

interface Ref {
  id: string;
  label: string;
}

export function CustomersManager({
  rows,
  managers,
}: {
  rows: CustomerListRow[];
  managers: Ref[];
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
  } = useCrudManager<CustomerListRow, CustomerRow>(
    rows,
    (r) => `${r.company} ${r.contact ?? ""} ${r.phone ?? ""} ${r.email ?? ""} ${r.bin ?? ""}`
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        onAdd={openCreate}
        addLabel="Добавить клиента"
        placeholder="Поиск по компании, контакту, БИН…"
        count={rows.length}
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Компания</TableHead>
              <TableHead>Контакт</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Ответственный</TableHead>
              <TableHead className="text-center">Сделки</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const meta = customerStatusMeta[row.status] ?? customerStatusMeta.LEAD;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/admin/crm/customers/${row.id}`}
                      className="font-medium text-primary hover:text-signal-700"
                    >
                      {row.company}
                    </Link>
                    {row.city && <div className="text-xs text-muted-foreground">{row.city}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-primary">{row.contact ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{row.phone ?? row.email ?? ""}</div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", meta.className)}>
                      {meta.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.ownerName ?? "—"}</TableCell>
                  <TableCell className="text-center">{row.dealCount}</TableCell>
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
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Клиентов не найдено.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Редактировать клиента" : "Новый клиент"}
      >
        <CustomerForm initial={editing} managers={managers} onDone={closeForm} />
      </FormDialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={closeDelete}
        description={
          deleting
            ? `Клиент «${deleting.company}» со всеми сделками и активностями будет удалён.`
            : ""
        }
        action={() => deleteCustomer(deleting!.id)}
      />
    </div>
  );
}
