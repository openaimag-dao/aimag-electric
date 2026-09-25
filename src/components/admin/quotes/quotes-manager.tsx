"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
import {
  MoreHorizontal,
  Trash2,
  Eye,
  Download,
  Link2,
  PackagePlus,
  Loader2,
  AlertTriangle,
  Check,
  X,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { FormDialog } from "@/components/admin/form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { QuoteStatusBadge, quoteStatusMeta } from "@/components/admin/quote-status-badge";
import {
  setQuoteStatus,
  deleteQuote,
  createOrderFromQuote,
  updateQuoteItemPrice,
} from "@/server/actions/admin";
import { formatTiyn, formatTenge, tiynToTenge, tengeToTiyn } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface QuoteItemRow {
  id: string;
  title: string;
  sku: string | null;
  qty: number;
  unit: string;
  amountTiyn: number | null;
  note: string | null;
  /** This company's reference price for the item's product, if resolved — a suggestion shown while editing, never applied automatically. */
  suggestedPriceTenge: number | null;
}

export interface QuoteListRow {
  id: string;
  title: string | null;
  sourcePath: string | null;
  company: string;
  /** The company this quote was confidently resolved to (via the submitter's account), if any — distinct from the free-text `company` label above. */
  resolvedCompanyName: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: string;
  createdAt: string;
  approvalToken: string | null;
  respondedAt: string | null;
  responseNote: string | null;
  hasOrder: boolean;
  items: QuoteItemRow[];
  /** CRM Customer this quote auto-linked to (exact phone/email match, or a newly created lead) — null only if the link itself failed. */
  customerId: string | null;
  /** The customer's assigned manager (round-robin on first link), if any. */
  ownerName: string | null;
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

export function QuotesManager({
  rows,
  snapshotTime,
}: {
  rows: QuoteListRow[];
  snapshotTime: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState("");
  const [viewing, setViewing] = React.useState<QuoteListRow | undefined>();
  const [deleting, setDeleting] = React.useState<QuoteListRow | undefined>();
  const [pending, setPending] = React.useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = React.useState(false);
  const [reviewOnly, setReviewOnly] = React.useState(false);
  const [editingPriceId, setEditingPriceId] = React.useState<string | null>(null);
  const [priceDraft, setPriceDraft] = React.useState("");
  const [savingPrice, setSavingPrice] = React.useState(false);
  const [waitingOnly, setWaitingOnly] = React.useState(false);
  const [refreshing, startRefresh] = React.useTransition();
  const requestedStatus = searchParams.get("status") ?? "ALL";
  const statusFilter = Object.hasOwn(quoteStatusMeta, requestedStatus) ? requestedStatus : "ALL";
  const waitingCutoff = Date.parse(snapshotTime) - 24 * 60 * 60 * 1000;
  const isWaiting = (row: QuoteListRow) =>
    row.status === "NEW" && Date.parse(row.createdAt) <= waitingCutoff;
  const newCount = rows.filter((row) => row.status === "NEW").length;
  const waitingCount = rows.filter(isWaiting).length;

  function selectStatus(status: string) {
    setWaitingOnly(false);
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") params.delete("status");
    else params.set("status", status);
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  // Deep-link support: /admin/quotes?quote=<id> (used from the CRM customer
  // page) opens that quote's dialog on load.
  React.useEffect(() => {
    const quoteId = searchParams.get("quote");
    if (!quoteId) return;
    const row = rows.find((r) => r.id === quoteId);
    if (row) setViewing(row);
  }, [searchParams, rows]);

  function closeViewing() {
    setViewing(undefined);
    if (searchParams.get("quote")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("quote");
      router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
    }
  }

  function startEditPrice(item: QuoteItemRow) {
    setEditingPriceId(item.id);
    setPriceDraft(item.amountTiyn !== null ? String(tiynToTenge(item.amountTiyn)) : "");
  }

  async function handleSavePrice(itemId: string) {
    const trimmed = priceDraft.trim();
    let priceTenge: number | null = null;
    if (trimmed !== "") {
      const n = Number(trimmed.replace(",", "."));
      if (!Number.isFinite(n) || n < 0) {
        toast.error("Некорректная цена");
        return;
      }
      priceTenge = n;
    }
    setSavingPrice(true);
    const result = await updateQuoteItemPrice(itemId, priceTenge);
    setSavingPrice(false);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось изменить цену");
      return;
    }
    const amountTiyn = priceTenge !== null ? tengeToTiyn(priceTenge) : null;
    setViewing((prev) =>
      prev
        ? { ...prev, items: prev.items.map((i) => (i.id === itemId ? { ...i, amountTiyn } : i)) }
        : prev
    );
    setEditingPriceId(null);
    toast.success("Цена обновлена");
  }

  async function handleCreateOrder(quoteId: string) {
    setCreatingOrder(true);
    const result = await createOrderFromQuote(quoteId);
    setCreatingOrder(false);
    if (!result.ok || !result.data) {
      toast.error(result.error ?? "Не удалось создать заказ");
      return;
    }
    toast.success("Заказ создан");
    setViewing(undefined);
    router.push(`/admin/orders/${result.data.id}`);
  }

  const reviewCount = rows.filter((r) => r.items.some((i) => i.note)).length;

  const filtered = rows
    .filter((r) =>
      `${r.company} ${r.name} ${r.phone} ${r.email ?? ""} ${r.title ?? ""} ${r.sourcePath ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase().trim())
    )
    .filter((r) => !reviewOnly || r.items.some((i) => i.note))
    .filter((r) =>
      waitingOnly ? isWaiting(r) : statusFilter === "ALL" || r.status === statusFilter
    )
    .sort((a, b) =>
      waitingOnly || statusFilter === "NEW"
        ? Date.parse(a.createdAt) - Date.parse(b.createdAt)
        : Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );

  const sourceStats = [
    ...rows
      .reduce((groups, row) => {
        const source = row.sourcePath || "Не определена";
        const stat = groups.get(source) ?? { source, requests: 0, won: 0, orders: 0 };
        stat.requests++;
        if (row.status === "WON") stat.won++;
        if (row.hasOrder) stat.orders++;
        groups.set(source, stat);
        return groups;
      }, new Map<string, { source: string; requests: number; won: number; orders: number }>())
      .values(),
  ]
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);

  async function changeStatus(id: string, status: string) {
    setPending(id);
    try {
      const result = await setQuoteStatus(id, status);
      if (result.ok) {
        setViewing((current) => (current?.id === id ? { ...current, status } : current));
        toast.success("Статус обновлён");
      } else toast.error(result.error ?? "Ошибка");
    } catch {
      toast.error("Не удалось обновить статус. Проверьте связь и обновите список.");
    } finally {
      setPending(null);
    }
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
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Button
          variant={statusFilter === "NEW" && !waitingOnly ? "signal" : "outline"}
          onClick={() => selectStatus("NEW")}
        >
          Новые ({newCount})
        </Button>
        <Button
          variant={waitingOnly ? "signal" : "outline"}
          aria-pressed={waitingOnly}
          onClick={() => setWaitingOnly((value) => !value)}
        >
          Новые больше суток ({waitingCount})
        </Button>
        <label className="flex items-center gap-2 text-sm">
          Статус
          <select
            value={waitingOnly ? "NEW" : statusFilter}
            onChange={(event) => selectStatus(event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2"
          >
            <option value="ALL">Все</option>
            {Object.entries(quoteStatusMeta).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="outline"
          disabled={refreshing}
          onClick={() => startRefresh(() => router.refresh())}
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          Обновить
        </Button>
        <p className="w-full text-xs text-muted-foreground">
          Возраст считается с момента создания заявки. В списке новых первыми показаны самые ранние.
        </p>
      </div>
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Поиск по компании, контакту, телефону…"
        count={filtered.length}
      />

      <section
        className="rounded-xl border border-border bg-card p-5"
        aria-label="Заявки по страницам"
      >
        <h2 className="font-display text-lg font-semibold text-primary">Заявки по страницам</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Топ-10 страниц за всё время. Источник новых заявок сохраняется с момента этого обновления;
          старые заявки отображаются без него. Кликов по телефону и WhatsApp здесь нет.
        </p>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Страница заявки</TableHead>
                <TableHead className="text-right">Заявки</TableHead>
                <TableHead className="text-right">Выиграны</TableHead>
                <TableHead className="text-right">Заказы</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sourceStats.map((stat) => (
                <TableRow key={stat.source}>
                  <TableCell className="max-w-xs break-all">{stat.source}</TableCell>
                  <TableCell className="text-right">{stat.requests}</TableCell>
                  <TableCell className="text-right">{stat.won}</TableCell>
                  <TableCell className="text-right">{stat.orders}</TableCell>
                </TableRow>
              ))}
              {sourceStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Заявок пока нет.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {reviewCount > 0 && (
        <Button
          variant={reviewOnly ? "signal" : "outline"}
          size="sm"
          onClick={() => setReviewOnly((v) => !v)}
        >
          <AlertTriangle className="size-4" />
          {reviewOnly ? "Показать все" : `Требуют проверки (${reviewCount})`}
        </Button>
      )}

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
                <TableCell className="font-medium text-primary">
                  <button
                    type="button"
                    onClick={() => setViewing(row)}
                    className="text-left hover:underline"
                  >
                    {row.company}
                  </button>
                  {isWaiting(row) && (
                    <p className="mt-1 text-xs text-amber-700">Новая больше суток</p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-primary">{row.name}</div>
                  <div className="text-xs text-muted-foreground">{row.phone}</div>
                  {row.ownerName && (
                    <div className="mt-0.5 text-xs text-signal-700">→ {row.ownerName}</div>
                  )}
                </TableCell>
                <TableCell>
                  {row.items.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-primary">
                      {row.items.length} поз. · {formatTiyn(quoteTotalTiyn(row.items))}
                      {row.items.some((i) => i.note) && (
                        <AlertTriangle
                          className="size-3.5 shrink-0 text-amber-600"
                          aria-label="Есть позиции, требующие проверки"
                        />
                      )}
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
        onOpenChange={(o) => !o && closeViewing()}
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
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Страница заявки</span>
              <span className="break-all text-right text-primary">
                {viewing.sourcePath ?? "Не определена"}
              </span>
            </div>
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
            {viewing.customerId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Клиент в CRM</span>
                <Link
                  href={`/admin/crm/customers/${viewing.customerId}`}
                  className="text-signal-700 hover:underline"
                >
                  {viewing.ownerName ? `Ответственный: ${viewing.ownerName}` : "Открыть карточку"}
                </Link>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Статус</span>
              <QuoteStatusBadge status={viewing.status} />
            </div>
            {viewing.status === "NEW" && (
              <Button
                variant="signal"
                disabled={pending === viewing.id}
                onClick={() => changeStatus(viewing.id, "IN_PROGRESS")}
              >
                {pending === viewing.id && <Loader2 className="size-4 animate-spin" />}
                Взять в работу
              </Button>
            )}
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

            {viewing.respondedAt &&
              (() => {
                // IN_PROGRESS + respondedAt only happens via the "changes requested"
                // path (see quote-response-actions.ts) — a fresh, never-sent quote
                // has no respondedAt at all.
                const outcome =
                  viewing.status === "WON"
                    ? {
                        verb: "одобрил",
                        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
                      }
                    : viewing.status === "IN_PROGRESS"
                      ? {
                          verb: "запросил изменения в",
                          className: "border-amber-200 bg-amber-50 text-amber-700",
                        }
                      : { verb: "отклонил", className: "border-red-200 bg-red-50 text-red-700" };
                return (
                  <div className={cn("rounded-lg border p-3", outcome.className)}>
                    Клиент {outcome.verb} КП {formatDate(viewing.respondedAt)}
                    {viewing.responseNote && <p className="mt-1">«{viewing.responseNote}»</p>}
                  </div>
                );
              })()}

            {viewing.status === "WON" && !viewing.hasOrder && (
              <Button
                variant="signal"
                size="sm"
                className="w-full"
                onClick={() => handleCreateOrder(viewing.id)}
                disabled={creatingOrder}
              >
                {creatingOrder ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PackagePlus className="size-4" />
                )}
                Создать заказ
              </Button>
            )}

            {viewing.hasOrder && (
              <Link
                href="/admin/orders"
                className="block rounded-lg border border-border bg-secondary/40 p-3 text-center text-signal-700 hover:underline"
              >
                Заказ уже создан — открыть список заказов
              </Link>
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
                            {i.note && (
                              <div className="mt-1 flex items-start gap-1 text-amber-700">
                                <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                                <span>{i.note}</span>
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap p-2 text-muted-foreground">
                            {i.qty} {i.unit}
                          </td>
                          <td className="whitespace-nowrap p-2 text-right font-medium text-primary">
                            {editingPriceId === i.id ? (
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center justify-end gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                    value={priceDraft}
                                    onChange={(e) => setPriceDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSavePrice(i.id);
                                      if (e.key === "Escape") setEditingPriceId(null);
                                    }}
                                    placeholder="по запросу"
                                    disabled={savingPrice}
                                    className="w-24 rounded border border-input px-1.5 py-0.5 text-right text-xs"
                                  />
                                  <button
                                    type="button"
                                    aria-label="Сохранить цену"
                                    onClick={() => handleSavePrice(i.id)}
                                    disabled={savingPrice}
                                    className="hover:text-signal-800 text-signal-700 disabled:opacity-50"
                                  >
                                    {savingPrice ? (
                                      <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                      <Check className="size-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Отменить"
                                    onClick={() => setEditingPriceId(null)}
                                    disabled={savingPrice}
                                    className="text-muted-foreground hover:text-red-600 disabled:opacity-50"
                                  >
                                    <X className="size-3.5" />
                                  </button>
                                </div>
                                {i.suggestedPriceTenge !== null && (
                                  <button
                                    type="button"
                                    onClick={() => setPriceDraft(String(i.suggestedPriceTenge))}
                                    className="font-normal text-muted-foreground hover:text-signal-700 hover:underline"
                                    title={`Цена для «${viewing.resolvedCompanyName}» — нажмите, чтобы подставить`}
                                  >
                                    Цена компании: {formatTenge(i.suggestedPriceTenge)}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditPrice(i)}
                                title="Изменить цену за единицу"
                                className="inline-flex items-center gap-1 hover:text-signal-700 hover:underline"
                              >
                                {i.amountTiyn !== null
                                  ? formatTiyn(i.amountTiyn * i.qty)
                                  : "по запросу"}
                                <Pencil className="size-3 text-muted-foreground" />
                              </button>
                            )}
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
