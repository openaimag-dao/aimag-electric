"use client";

import { FileSpreadsheet, Plus, RefreshCw, MinusCircle, AlertTriangle, XOctagon } from "lucide-react";

import type { ImportPreview } from "@/types/import";

export function ImportSummaryBar({
  preview,
  fileName,
}: {
  preview: ImportPreview;
  fileName: string;
}) {
  const { counts, totalRows } = preview;
  const items = [
    { label: "Создать", value: counts.create, icon: Plus, className: "text-emerald-700" },
    { label: "Обновить", value: counts.update, icon: RefreshCw, className: "text-blue-700" },
    { label: "Пропустить", value: counts.skip, icon: MinusCircle, className: "text-muted-foreground" },
    { label: "Ошибки", value: counts.errors, icon: XOctagon, className: "text-red-700" },
    { label: "Предупреждения", value: counts.warnings, icon: AlertTriangle, className: "text-amber-700" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm">
        <FileSpreadsheet className="size-4 text-signal" />
        <span className="font-medium text-primary">{fileName}</span>
        <span className="text-muted-foreground">· {totalRows} строк</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.label} className="rounded-lg border border-border bg-secondary/30 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="size-3.5" /> {it.label}
              </div>
              <div className={`mt-1 font-display text-xl font-bold ${it.className}`}>{it.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
