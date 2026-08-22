"use client";

import * as React from "react";
import { toast } from "sonner";

import { NativeSelect } from "@/components/admin/form-fields";
import { projectStatusMeta, projectStatusOrder } from "@/config/project-meta";
import { setProjectStatus } from "@/server/actions/project-actions";
import { cn } from "@/lib/utils";

export function ProjectStatusSelect({
  projectId,
  status,
  editable,
}: {
  projectId: string;
  status: string;
  editable: boolean;
}) {
  const [current, setCurrent] = React.useState(status);
  const [saving, setSaving] = React.useState(false);
  const meta = projectStatusMeta[current] ?? projectStatusMeta.DRAFT;

  if (!editable) {
    return (
      <span
        className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", meta.className)}
      >
        {meta.label}
      </span>
    );
  }

  async function handleChange(next: string) {
    const prev = current;
    setCurrent(next);
    setSaving(true);
    const result = await setProjectStatus(projectId, next);
    setSaving(false);
    if (!result.ok) {
      setCurrent(prev);
      toast.error(result.error ?? "Не удалось изменить статус");
    }
  }

  return (
    <NativeSelect
      value={current}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      className={cn("h-8 w-auto text-xs font-medium", meta.className)}
    >
      {projectStatusOrder.map((s) => (
        <option key={s} value={s}>
          {projectStatusMeta[s].label}
        </option>
      ))}
    </NativeSelect>
  );
}
