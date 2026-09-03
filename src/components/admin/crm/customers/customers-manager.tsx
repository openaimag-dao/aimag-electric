"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";

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

export function CustomersManager({ rows, managers }: { rows: CustomerListRow[]; managers: Ref[] }) {
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

  // ?owner=<id> (from the staff dashboard's "Мои клиенты" stat) pre-filters
  // the table to that manager's customers.
  const searchParams = useSearchParams();
  const ownerFilterId = searchParams.get("owner");
  const ownerFilterName = ownerFilterId
    ? (managers.find((m) => m.id === ownerFilterId)?.label ?? null)
    : null;
  const visible = React.useMemo(
    () => (ownerFilterId ? filtered.filter((r) => r.ownerId === ownerFilterId) : filtered),
    [filtered, ownerFilterId]
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

      {ownerFilterId && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm">
          <span className="text-primary">
            Клиенты:{" "}
            <span className="font-medium">{ownerFilterName ?? "неизвестный менеджер"}</span>
          </span>
          <Link
            href="/admin/crm/customers"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
          >
            <X className="size-3.5" /> Показать всех
          </Link>
        </div>
      )}

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
            {visible.map((row) => {
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
                    <div className="text-xs text-muted-foreground">
                      {row.phone ?? row.email ?? ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        meta.className
                      )}
                    >
                      {meta.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.ownerName ?? "—"}</TableCell>
                  <TableCell className="text-center">{row.dealCount}</TableCell>
                  <TableCell>
                    <RowActions onEdit={() => openEdit(row)} onDelete={() => setDeleting(row)} />
                  </TableCell>
                </TableRow>
              );
            })}
            {visible.length === 0 && (
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
