"use client";

import * as React from "react";
import {
  StickyNote,
  Phone,
  Mail,
  Users,
  CheckSquare,
  Square,
  Trash2,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/admin/form-fields";
import { cn } from "@/lib/utils";
import { activityTypeMeta } from "@/config/crm-meta";
import { createActivity, toggleActivityDone, deleteActivity } from "@/server/actions/admin";

const ICONS: Record<string, LucideIcon> = {
  StickyNote,
  Phone,
  Mail,
  Users,
  CheckSquare,
};

export interface ActivityItem {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  dueAt: string | null;
  done: boolean;
  authorName: string | null;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityTimeline({
  activities,
  customerId,
  dealId,
}: {
  activities: ActivityItem[];
  customerId?: string;
  dealId?: string;
}) {
  const [type, setType] = React.useState("NOTE");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [dueAt, setDueAt] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function add() {
    if (subject.trim().length < 2) {
      toast.error("Укажите тему");
      return;
    }
    setSaving(true);
    const result = await createActivity({
      type,
      subject,
      body,
      dueAt: type === "TASK" ? dueAt : "",
      customerId: customerId ?? "",
      dealId: dealId ?? "",
    });
    setSaving(false);
    if (result.ok) {
      toast.success("Активность добавлена");
      setSubject("");
      setBody("");
      setDueAt("");
    } else {
      toast.error(result.error ?? "Ошибка");
    }
  }

  async function toggle(id: string, done: boolean) {
    const result = await toggleActivityDone(id, done);
    if (!result.ok) toast.error(result.error ?? "Ошибка");
  }

  async function remove(id: string) {
    const result = await deleteActivity(id);
    if (result.ok) toast.success("Удалено");
    else toast.error(result.error ?? "Ошибка");
  }

  return (
    <div className="space-y-4">
      {/* Composer */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-2">
          <NativeSelect
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 w-40"
          >
            {Object.entries(activityTypeMeta).map(([k, m]) => (
              <option key={k} value={k}>{m.label}</option>
            ))}
          </NativeSelect>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Тема"
            className="h-10 min-w-[12rem] flex-1"
          />
          {type === "TASK" && (
            <Input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="h-10 w-52"
            />
          )}
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Детали (необязательно)"
          rows={2}
          className="mt-2"
        />
        <div className="mt-2 flex justify-end">
          <Button variant="signal" size="sm" onClick={add} disabled={saving}>
            <Plus className="size-4" /> Добавить
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {activities.map((a) => {
          const meta = activityTypeMeta[a.type] ?? activityTypeMeta.NOTE;
          const Icon = ICONS[meta.icon] ?? StickyNote;
          const overdue = a.type === "TASK" && !a.done && a.dueAt && new Date(a.dueAt) < new Date();
          return (
            <div
              key={a.id}
              className="group flex gap-3 rounded-lg border border-border bg-card p-3"
            >
              <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-steel-950 text-signal">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn("text-sm font-medium text-primary", a.done && "line-through opacity-60")}>
                      {a.subject}
                    </p>
                    {a.body && <p className="mt-0.5 text-sm text-muted-foreground">{a.body}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {a.type === "TASK" && (
                      <button
                        onClick={() => toggle(a.id, !a.done)}
                        className="rounded p-1 text-muted-foreground hover:text-signal-700"
                        aria-label="Отметить"
                      >
                        {a.done ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => remove(a.id)}
                      className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                      aria-label="Удалить"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{meta.label}</span>
                  <span>·</span>
                  <span>{formatDate(a.createdAt)}</span>
                  {a.authorName && <><span>·</span><span>{a.authorName}</span></>}
                  {a.dueAt && (
                    <>
                      <span>·</span>
                      <span className={cn(overdue && "font-medium text-red-600")}>
                        срок {formatDate(a.dueAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {activities.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Активностей пока нет. Добавьте заметку, звонок или задачу.
          </p>
        )}
      </div>
    </div>
  );
}
