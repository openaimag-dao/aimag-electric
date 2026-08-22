"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Eye, Download, Link2 } from "lucide-react";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { FormDialog } from "@/components/admin/form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { QuoteStatusBadge, quoteStatusMeta } from "@/components/admin/quote-status-badge";
import { setQuoteStatus, deleteQuote } from "@/server/actions/admin";
import { formatTiyn } from "@/lib/money";

export interface QuoteItemRow {
  id: string;
  title: string;
  sku: string | null;
  qty: number;
  unit: string;
  amountTiyn: number | null;
}

export interface QuoteListRow {
  id: string;
  title: string | null;
  company: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: string;
  createdAt: string;
  approvalToken: string | null;
  respondedAt: string | null;
  responseNote: string | null;
  items: QuoteItemRow[];
}

function quoteTotalTiyn(items: QuoteItemRow[]): number {
  return items.reduce((sum, i) => sum + (i.amountTiyn ?? 0) * i.qty, 0);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function QuotesManager({ rows }: { rows: QuoteListRow[] }) {
  const [query, setQuery] = React.useState("");
  const [viewing, setViewing] = React.useState<QuoteListRow | undefined>();
  const [deleting, setDeleting] = React.useState<QuoteListRow | undefined>();
  const [pending, setPending] = React.useState<string | null>(null);

  const filtered = rows.filter((r) =>
    `${r.company} ${r.name} ${r.phone} ${r.email ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase().trim())
  );

  async function changeStatus(id: string, status: string) {
    setPending(id);
    const result = await setQuoteStatus(id, status);
    setPending(null);
    if (result.ok) toast.success("Статус обновлён");
    else toast.error(result.error ?? "Ошибка");
  }

  async function copyClientLink(token: string) {
    const url = `${window.location.origin}/kp/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Ссылка скопирована");
    } catch {
      toast.error("Не удалось скопировать. Ссылка: " + url);
    }
  }

  return (
    <div className="space-y-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Поиск по компании, контакту, телефону…"
        count={rows.length}
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Компания</TableHead>
              <TableHead>Контакт</TableHead>
              <TableHead>Позиции</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium text-primary">{row.company}</TableCell>
                <TableCell>
                  <div className="text-sm text-primary">{row.name}</div>
                  <div className="text-xs text-muted-foreground">{row.phone}</div>
                </TableCell>
                <TableCell>
                  {row.items.length > 0 ? (
                    <span className="text-primary">
                      {row.items.length} поз. · {formatTiyn(quoteTotalTiyn(row.items))}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger disabled={pending === row.id}>
                      <QuoteStatusBadge status={row.status} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Сменить статус</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.entries(quoteStatusMeta).map(([value, meta]) => (
                        <DropdownMenuItem key={value} onSelect={() => changeStatus(row.id, value)}>
                          {meta.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8" aria-label="Действия">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setViewing(row)}>
                        <Eye /> Открыть
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="danger" onSelect={() => setDeleting(row)}>
                        <Trash2 /> Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Заявок не найдено.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <FormDialog
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(undefined)}
        title="Заявка на КП"
      >
        {viewing && (
          <div className="space-y-3 text-sm">
            {viewing.title && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Проект</span>
                <span className="font-medium text-primary">{viewing.title}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Компания</span>
              <span className="font-medium text-primary">{viewing.company}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Контакт</span>
              <span className="text-primary">{viewing.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Телефон</span>
              <a href={`tel:${viewing.phone}`} className="text-signal-700">
                {viewing.phone}
              </a>
            </div>
            {viewing.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">E-mail</span>
                <a href={`mailto:${viewing.email}`} className="text-signal-700">
                  {viewing.email}
                </a>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Статус</span>
              <QuoteStatusBadge status={viewing.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Дата</span>
              <span className="text-primary">{formatDate(viewing.createdAt)}</span>
            </div>

            {viewing.approvalToken && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ссылка для клиента</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyClientLink(viewing.approvalToken!)}
                >
                  <Link2 className="size-3.5" /> Скопировать
                </Button>
              </div>
            )}

            {viewing.respondedAt && (
              <div
                className={
                  viewing.status === "WON"
                    ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700"
                    : "rounded-lg border border-red-200 bg-red-50 p-3 text-red-700"
                }
              >
                Клиент {viewing.status === "WON" ? "одобрил" : "отклонил"} КП{" "}
                {formatDate(viewing.respondedAt)}
                {viewing.responseNote && <p className="mt-1">«{viewing.responseNote}»</p>}
              </div>
            )}

            {viewing.items.length > 0 && (
              <div className="pt-2">
                <div className="mb-1 text-muted-foreground">Позиции ({viewing.items.length})</div>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <tbody>
                      {viewing.items.map((i) => (
                        <tr key={i.id} className="border-b border-border last:border-0">
                          <td className="p-2 text-primary">
                            {i.title}
                            {i.sku && <span className="ml-1 text-muted-foreground">({i.sku})</span>}
                          </td>
                          <td className="whitespace-nowrap p-2 text-muted-foreground">
                            {i.qty} {i.unit}
                          </td>
                          <td className="whitespace-nowrap p-2 text-right font-medium text-primary">
                            {i.amountTiyn !== null
                              ? formatTiyn(i.amountTiyn * i.qty)
                              : "по запросу"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-medium text-primary">
                    Итого: {formatTiyn(quoteTotalTiyn(viewing.items))}
                  </span>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={`/admin/quotes/${viewing.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="size-4" /> Скачать PDF
                    </a>
                  </Button>
                </div>
              </div>
            )}

            <div className="pt-2">
              <div className="mb-1 text-muted-foreground">Сообщение</div>
              <p className="whitespace-pre-wrap rounded-lg border border-border bg-secondary/40 p-3 text-primary">
                {viewing.message}
              </p>
            </div>
          </div>
        )}
      </FormDialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        description={deleting ? `Заявка от «${deleting.company}» будет удалена.` : ""}
        action={() => deleteQuote(deleting!.id)}
      />
    </div>
  );
}
