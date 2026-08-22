"use client";

import * as React from "react";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/admin/form-fields";
import { companyRoleMeta, companyRoleOrder } from "@/config/company-meta";
import {
  addCompanyMember,
  removeCompanyMember,
  updateCompanyMemberRole,
} from "@/server/actions/admin";
import { cn } from "@/lib/utils";

export interface CompanyMemberRow {
  id: string;
  userId: string;
  role: string;
  user: { name: string | null; email: string };
}

export interface UserOption {
  id: string;
  label: string;
}

export function CompanyMembersPanel({
  companyId,
  initialMembers,
  users,
}: {
  companyId: string;
  initialMembers: CompanyMemberRow[];
  /** Portal users not yet in this company — candidates for "add member". */
  users: UserOption[];
}) {
  const [members, setMembers] = React.useState(initialMembers);
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<string>("VIEWER");
  const [adding, setAdding] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const memberUserIds = new Set(members.map((m) => m.userId));
  const availableUsers = users.filter((u) => !memberUserIds.has(u.id));

  async function handleAdd() {
    if (!selectedUserId) return;
    setAdding(true);
    const result = await addCompanyMember({
      companyId,
      userId: selectedUserId,
      role: selectedRole,
    });
    setAdding(false);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось добавить сотрудника");
      return;
    }
    const user = users.find((u) => u.id === selectedUserId);
    setMembers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        userId: selectedUserId,
        role: selectedRole,
        user: { name: user?.label ?? "", email: "" },
      },
    ]);
    setSelectedUserId("");
    toast.success("Сотрудник добавлен");
  }

  async function handleRoleChange(memberId: string, role: string) {
    setUpdatingId(memberId);
    const result = await updateCompanyMemberRole(memberId, role);
    setUpdatingId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось изменить роль");
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId);
    const result = await removeCompanyMember(memberId);
    setRemovingId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось удалить сотрудника");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    toast.success("Сотрудник удалён из компании");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card">
        {members.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            В компании пока нет сотрудников с доступом в личный кабинет.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {members.map((m) => {
              const meta = companyRoleMeta[m.role] ?? companyRoleMeta.VIEWER;
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary">
                      {m.user.name || m.user.email}
                    </p>
                    {m.user.email && (
                      <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <NativeSelect
                      value={m.role}
                      disabled={updatingId === m.id}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      className={cn("h-9 w-auto text-xs", meta.className)}
                    >
                      {companyRoleOrder.map((role) => (
                        <option key={role} value={role}>
                          {companyRoleMeta[role].label}
                        </option>
                      ))}
                    </NativeSelect>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-red-600"
                      onClick={() => handleRemove(m.id)}
                      disabled={removingId === m.id}
                      aria-label="Удалить из компании"
                    >
                      {removingId === m.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-border p-3">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Добавить сотрудника
          </label>
          <NativeSelect value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
            <option value="">— выберите пользователя —</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="w-44">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Роль</label>
          <NativeSelect value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            {companyRoleOrder.map((role) => (
              <option key={role} value={role}>
                {companyRoleMeta[role].label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button
          type="button"
          variant="signal"
          onClick={handleAdd}
          disabled={adding || !selectedUserId}
        >
          {adding ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          Добавить
        </Button>
      </div>

      {availableUsers.length === 0 && members.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Все зарегистрированные пользователи уже добавлены в эту компанию.
        </p>
      )}
    </div>
  );
}
