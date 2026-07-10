"use client";

import { useCrudManager } from "@/hooks/use-crud-manager";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { RowActions } from "@/components/admin/row-actions";
import { FormDialog } from "@/components/admin/form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { UserForm, type UserRow } from "@/components/admin/users/user-form";
import { deleteUser } from "@/server/actions/admin";

export interface UserListRow extends UserRow {
  quoteCount: number;
  createdAt: string;
}

const roleMeta: Record<string, { label: string; variant: "signal" | "muted" | "outline" }> = {
  ADMIN: { label: "Администратор", variant: "signal" },
  MANAGER: { label: "Менеджер", variant: "outline" },
  CUSTOMER: { label: "Клиент", variant: "muted" },
};

export function UsersManager({ rows }: { rows: UserListRow[] }) {
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
  } = useCrudManager<UserListRow, UserRow>(
    rows,
    (r) => `${r.name ?? ""} ${r.email} ${r.company ?? ""}`
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        onAdd={openCreate}
        addLabel="Добавить пользователя"
        placeholder="Поиск по имени, e-mail, компании…"
        count={rows.length}
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Компания</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead className="text-center">Заявок</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const meta = roleMeta[row.role] ?? roleMeta.CUSTOMER;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium text-primary">{row.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{row.email}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.company ?? "—"}</TableCell>
                  <TableCell><Badge variant={meta.variant}>{meta.label}</Badge></TableCell>
                  <TableCell className="text-center">{row.quoteCount}</TableCell>
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
        title={editing ? "Редактировать пользователя" : "Новый пользователь"}
      >
        <UserForm initial={editing} onDone={closeForm} />
      </FormDialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={closeDelete}
        description={deleting ? `Пользователь ${deleting.email} будет удалён.` : ""}
        action={() => deleteUser(deleting!.id)}
      />
    </div>
  );
}
