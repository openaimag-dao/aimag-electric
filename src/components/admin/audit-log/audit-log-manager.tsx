"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NativeSelect } from "@/components/admin/form-fields";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { cn } from "@/lib/utils";
import { useAdminAuditLogFilters } from "@/hooks/use-admin-audit-log-filters";
import { AUDIT_ACTIONS } from "@/lib/admin/audit-log-url";

export interface AuditLogListRow {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
  meta: unknown;
  actorEmail: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Вход",
  LOGOUT: "Выход",
  CREATE: "Создание",
  UPDATE: "Изменение",
  DELETE: "Удаление",
  IMPORT: "Импорт",
  EXPORT: "Экспорт",
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "text-muted-foreground",
  LOGOUT: "text-muted-foreground",
  CREATE: "text-emerald-700",
  UPDATE: "text-steel-700",
  DELETE: "text-red-600",
  IMPORT: "text-signal-700",
  EXPORT: "text-signal-700",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditLogManager({
  rows,
  entities,
  total,
  page,
  pageCount,
}: {
  rows: AuditLogListRow[];
  entities: string[];
  total: number;
  page: number;
  pageCount: number;
}) {
  const { query, update } = useAdminAuditLogFilters();
  const [searchInput, setSearchInput] = React.useState(query.q);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  React.useEffect(() => setSearchInput(query.q), [query.q]);
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== query.q) update({ q: searchInput });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fire on input change, not on every query update
  }, [searchInput]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по описанию, email…"
            className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm shadow-sm focus-visible:border-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <NativeSelect
          value={query.entity}
          onChange={(e) => update({ entity: e.target.value })}
          className="h-10 w-auto"
        >
          <option value="">Все разделы</option>
          {entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          value={query.action}
          onChange={(e) => update({ action: e.target.value as typeof query.action })}
          className="h-10 w-auto"
        >
          <option value="">Все действия</option>
          {AUDIT_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a]}
            </option>
          ))}
        </NativeSelect>

        <span className="ml-auto text-sm text-muted-foreground">Всего: {total}</span>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead className="w-44">Дата</TableHead>
              <TableHead className="w-28">Действие</TableHead>
              <TableHead className="w-40">Раздел</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead className="w-56">Кто</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const hasMeta = row.meta !== null && row.meta !== undefined;
              const isOpen = expanded.has(row.id);
              return (
                <React.Fragment key={row.id}>
                  <TableRow
                    className={hasMeta ? "cursor-pointer" : undefined}
                    onClick={() => hasMeta && toggle(row.id)}
                  >
                    <TableCell>
                      {hasMeta &&
                        (isOpen ? (
                          <ChevronDown className="size-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-3.5 text-muted-foreground" />
                        ))}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(row.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-sm font-medium", ACTION_COLORS[row.action])}>
                        {ACTION_LABELS[row.action] ?? row.action}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {row.entity}
                    </TableCell>
                    <TableCell className="text-sm text-primary">{row.summary}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.actorEmail ?? "система"}
                    </TableCell>
                  </TableRow>
                  {hasMeta && isOpen && (
                    <TableRow>
                      <TableCell />
                      <TableCell colSpan={5}>
                        <pre className="max-w-full overflow-x-auto rounded-md bg-secondary/50 p-3 text-xs text-steel-700">
                          {JSON.stringify(row.meta, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Ничего не найдено.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AdminPagination
        page={page}
        pageCount={pageCount}
        onPageChange={(p) => update({ page: p }, { keepPage: true })}
      />
    </div>
  );
}
