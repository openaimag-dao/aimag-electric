"use client";

import * as React from "react";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/admin/form-fields";
import { companyRoleMeta, companyRoleOrder } from "@/config/company-meta";
import {
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
} from "@/server/actions/company-team-actions";
import { cn } from "@/lib/utils";

export interface TeamMemberRow {
  id: string;
  userId: string;
  role: string;
  user: { name: string | null; email: string };
}

export function CompanyTeamPanel({
  companyId,
  initialMembers,
  canManage,
  currentUserId,
}: {
  companyId: string;
  initialMembers: TeamMemberRow[];
  /** Edit controls only render for a COMPANY_ADMIN of this company — everyone else sees a read-only list. */
  canManage: boolean;
  currentUserId: string;
}) {
  const [members, setMembers] = React.useState(initialMembers);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("VIEWER");
  const [inviting, setInviting] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  async function handleInvite() {
    const trimmed = email.trim();
    if (!trimmed) return;
    setInviting(true);
    const result = await inviteTeamMember({ companyId, email: trimmed, role });
    setInviting(false);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось добавить сотрудника");
      return;
    }
    setEmail("");
    toast.success("Сотрудник добавлен. Обновите страницу, чтобы увидеть его в списке.");
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    setUpdatingId(memberId);
    const result = await updateTeamMemberRole({ companyId, memberId, role: newRole });
    setUpdatingId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось изменить роль");
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId);
    const result = await removeTeamMember(companyId, memberId);
    setRemovingId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось удалить сотрудника");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    toast.success("Сотрудник удалён");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card">
        {members.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">В компании пока нет сотрудников.</p>
        ) : (
          <div className="divide-y divide-border">
            {members.map((m) => {
              const meta = companyRoleMeta[m.role] ?? companyRoleMeta.VIEWER;
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary">
                      {m.user.name || m.user.email}
                      {m.userId === currentUserId && (
                        <span className="ml-1.5 text-xs text-muted-foreground">(вы)</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                  {canManage ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <NativeSelect
                        value={m.role}
                        disabled={updatingId === m.id}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        className={cn("h-9 w-auto text-xs", meta.className)}
                      >
                        {companyRoleOrder.map((r) => (
                          <option key={r} value={r}>
                            {companyRoleMeta[r].label}
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
                  ) : (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        meta.className
                      )}
                    >
                      {meta.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canManage && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-border p-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Email сотрудника
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@company.kz"
            />
          </div>
          <div className="w-44">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Роль</label>
            <NativeSelect value={role} onChange={(e) => setRole(e.target.value)}>
              {companyRoleOrder.map((r) => (
                <option key={r} value={r}>
                  {companyRoleMeta[r].label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button
            type="button"
            variant="signal"
            onClick={handleInvite}
            disabled={inviting || !email.trim()}
          >
            {inviting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Добавить
          </Button>
          <p className="w-full text-xs text-muted-foreground">
            Сотрудник должен быть уже зарегистрирован в личном кабинете (страница «Регистрация»).
          </p>
        </div>
      )}
    </div>
  );
}
