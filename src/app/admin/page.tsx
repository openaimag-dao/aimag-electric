import Link from "next/link";
import { Suspense } from "react";
import {
  Package,
  FolderTree,
  Factory,
  Warehouse,
  Users,
  Inbox,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  Truck,
} from "lucide-react";

import { adminService } from "@/server/services/admin-service";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { DashboardInsights } from "@/components/admin/dashboard-insights";
import { QuoteStatusBadge, quoteStatusMeta } from "@/components/admin/quote-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminDashboardPage() {
  const { counters, quotesByStatus, recentQuotes, topProducts } = await adminService.dashboard();

  const statusMap = Object.fromEntries(quotesByStatus.map((q) => [q.status, q.count]));

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Дашборд"
        description="Обзор каталога, склада и заявок в реальном времени."
      />

      {/* Primary counters */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Товары" value={counters.products} icon={Package} href="/admin/products" />
        <StatCard
          label="Категории"
          value={counters.categories}
          icon={FolderTree}
          href="/admin/categories"
        />
        <StatCard
          label="Производители"
          value={counters.brands}
          icon={Factory}
          href="/admin/brands"
        />
        <StatCard
          label="Склады"
          value={counters.warehouses}
          icon={Warehouse}
          href="/admin/warehouses"
        />
        <StatCard
          label="Документы"
          value={counters.documents}
          icon={FileText}
          href="/admin/documents"
        />
        <StatCard label="Пользователи" value={counters.users} icon={Users} href="/admin/users" />
        <StatCard
          label="Новые заявки"
          value={counters.quotesNew}
          icon={Inbox}
          href="/admin/quotes"
          accent
        />
        <StatCard
          label="Заказы в обработку"
          value={counters.ordersNew}
          icon={Truck}
          href="/admin/orders"
          accent
        />
        <StatCard
          label="Позиций без остатка"
          value={counters.lowStock}
          icon={AlertTriangle}
          href="/admin/warehouses"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quotes funnel */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-primary">Заявки по статусам</h2>
            <Link
              href="/admin/quotes"
              className="inline-flex items-center gap-1 text-sm font-medium text-signal-700 hover:underline"
            >
              Все заявки <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {Object.keys(quoteStatusMeta).map((status) => {
              const count = statusMap[status] ?? 0;
              const total = counters.quotesTotal || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <QuoteStatusBadge status={status} />
                    <span className="font-medium text-primary">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-signal" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Конверсия КП → заказ</span>
            <span className="font-medium text-primary">
              {counters.quotesWithOrder} из {counters.quotesTotal}
              {counters.quotesTotal > 0 &&
                ` (${Math.round((counters.quotesWithOrder / counters.quotesTotal) * 100)}%)`}
            </span>
          </div>
          {counters.quotesWonNoOrder > 0 && (
            <Link
              href="/admin/quotes"
              className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 hover:underline"
            >
              <AlertTriangle className="size-3.5 shrink-0" />
              {counters.quotesWonNoOrder} одобрено, но заказ ещё не создан
            </Link>
          )}
        </div>

        {/* Top products */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-primary">Популярные товары</h2>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 text-sm font-medium text-signal-700 hover:underline"
            >
              Все товары <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="font-mono text-sm text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.brand} · {p.category}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-steel-600">
                  {p.popularity}
                </span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">Нет товаров.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent quotes */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-6">
          <h2 className="font-display text-lg font-semibold text-primary">Последние заявки</h2>
          <Link
            href="/admin/quotes"
            className="inline-flex items-center gap-1 text-sm font-medium text-signal-700 hover:underline"
          >
            Смотреть все <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Компания</TableHead>
              <TableHead>Контакт</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentQuotes.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium text-primary">
                  <Link
                    href={`/admin/quotes?quote=${q.id}`}
                    className="hover:text-signal-700 hover:underline"
                  >
                    {q.company}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{q.name}</TableCell>
                <TableCell>
                  <QuoteStatusBadge status={q.status} />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatDate(q.createdAt)}
                </TableCell>
              </TableRow>
            ))}
            {recentQuotes.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Заявок пока нет.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-secondary/40" />}>
        <DashboardInsights />
      </Suspense>
    </div>
  );
}
