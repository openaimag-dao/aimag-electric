"use client";

import * as React from "react";
import { Plus, RefreshCw, MinusCircle, AlertTriangle, XOctagon } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ImportPreview, PreparedRow, RowAction } from "@/types/import";

const actionMeta: Record<RowAction, { label: string; className: string; icon: typeof Plus }> = {
  create: { label: "Создать", className: "bg-emerald-50 text-emerald-700", icon: Plus },
  update: { label: "Обновить", className: "bg-blue-50 text-blue-700", icon: RefreshCw },
  skip: { label: "Пропуск", className: "bg-red-50 text-red-700", icon: MinusCircle },
};

type Filter = "all" | "create" | "update" | "skip" | "issues";

export function ImportPreviewTable({ preview }: { preview: ImportPreview }) {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [limit, setLimit] = React.useState(100);

  const filtered = preview.rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "issues") return r.issues.length > 0;
    return r.action === filter;
  });
  const shown = filtered.slice(0, limit);

  const chips: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Все", count: preview.rows.length },
    { key: "create", label: "Создать", count: preview.counts.create },
    { key: "update", label: "Обновить", count: preview.counts.update },
    { key: "skip", label: "Пропуск", count: preview.counts.skip },
    {
      key: "issues",
      label: "С замечаниями",
      count: preview.rows.filter((r) => r.issues.length > 0).length,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              setFilter(c.key);
              setLimit(100);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
              filter === c.key
                ? "border-signal bg-signal/10 text-steel-900"
                : "border-border bg-card text-muted-foreground hover:border-signal/40"
            )}
          >
            {c.label}
            <span className="font-mono text-xs">{c.count}</span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Строка</TableHead>
              <TableHead className="w-28">Действие</TableHead>
              <TableHead>Запись</TableHead>
              <TableHead>Замечания</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((r) => (
              <PreviewRow key={r.row} row={r} />
            ))}
            {shown.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Нет строк для отображения.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {filtered.length > shown.length && (
          <div className="border-t border-border p-3 text-center">
            <button
              onClick={() => setLimit((l) => l + 200)}
              className="text-sm font-medium text-signal-700 hover:underline"
            >
              Показать ещё ({filtered.length - shown.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewRow({ row }: { row: PreparedRow }) {
  const meta = actionMeta[row.action];
  const Icon = meta.icon;
  const errors = row.issues.filter((i) => i.level === "error");
  const warnings = row.issues.filter((i) => i.level === "warning");

  return (
    <TableRow className={row.action === "skip" ? "bg-red-50/30" : undefined}>
      <TableCell className="font-mono text-xs text-muted-foreground">{row.row}</TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            meta.className
          )}
        >
          <Icon className="size-3" />
          {meta.label}
        </span>
      </TableCell>
      <TableCell className="text-primary">{row.summary}</TableCell>
      <TableCell>
        {row.issues.length === 0 ? (
          <span className="text-xs text-emerald-600">OK</span>
        ) : (
          <div className="space-y-1">
            {errors.map((i, idx) => (
              <div key={`e${idx}`} className="flex items-start gap-1.5 text-xs text-red-600">
                <XOctagon className="mt-0.5 size-3 shrink-0" />
                <span>{i.message}</span>
              </div>
            ))}
            {warnings.map((i, idx) => (
              <div key={`w${idx}`} className="flex items-start gap-1.5 text-xs text-amber-600">
                <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                <span>{i.message}</span>
              </div>
            ))}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
