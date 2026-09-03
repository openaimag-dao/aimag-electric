import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, Building2, Hash } from "lucide-react";

import { customerAdminRepository, orderAdminRepository } from "@/server/repositories/admin";
import { ActivityTimeline, type ActivityItem } from "@/components/admin/crm/activity-timeline";
import { QuoteStatusBadge } from "@/components/admin/quote-status-badge";
import { customerStatusMeta, dealStageMeta } from "@/config/crm-meta";
import { orderStatusMeta } from "@/config/order-meta";
import { tiynToTenge, formatTenge } from "@/lib/money";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ActivityRel {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  dueAt: Date | null;
  done: boolean;
  author: { name: string | null; email: string } | null;
  createdAt: Date;
}
interface DealRel {
  id: string;
  title: string;
  stage: string;
  amount: number | null;
}
interface QuoteRel {
  id: string;
  name: string;
  status: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [customer, orders] = await Promise.all([
    customerAdminRepository.byId(id),
    orderAdminRepository.byCustomerId(id),
  ]);
  if (!customer) notFound();

  const statusMeta = customerStatusMeta[customer.status] ?? customerStatusMeta.LEAD;

  const activities: ActivityItem[] = customer.activities.map((a: ActivityRel) => ({
    id: a.id,
    type: a.type,
    subject: a.subject,
    body: a.body,
    dueAt: a.dueAt ? a.dueAt.toISOString() : null,
    done: a.done,
    authorName: a.author?.name ?? a.author?.email ?? null,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/crm/customers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> К списку клиентов
      </Link>

      {/* Header card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-primary">{customer.company}</h1>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                  statusMeta.className
                )}
              >
                {statusMeta.label}
              </span>
            </div>
            <div className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2">
              {customer.contact && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-4" /> {customer.contact}
                </span>
              )}
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center gap-1.5 hover:text-signal-700"
                >
                  <Phone className="size-4" /> {customer.phone}
                </a>
              )}
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-1.5 hover:text-signal-700"
                >
                  <Mail className="size-4" /> {customer.email}
                </a>
              )}
              {customer.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" /> {customer.city}
                </span>
              )}
              {customer.bin && (
                <span className="flex items-center gap-1.5">
                  <Hash className="size-4" /> БИН {customer.bin}
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            {customer.owner && (
              <div>Ответственный: {customer.owner.name ?? customer.owner.email}</div>
            )}
          </div>
        </div>
        {customer.notes && (
          <p className="mt-4 rounded-lg border border-border bg-secondary/40 p-3 text-sm text-primary">
            {customer.notes}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline (2 cols) */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-semibold text-primary">
            История активности
          </h2>
          <ActivityTimeline activities={activities} customerId={customer.id} />
        </div>

        {/* Deals + quotes (1 col) */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 font-display text-lg font-semibold text-primary">Сделки</h2>
            <div className="space-y-2">
              {customer.deals.map((d: DealRel) => {
                const meta = dealStageMeta[d.stage] ?? dealStageMeta.NEW;
                return (
                  <div key={d.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-primary">{d.title}</p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                          meta.className
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>
                    {d.amount !== null && (
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {formatTenge(tiynToTenge(d.amount))}
                      </p>
                    )}
                  </div>
                );
              })}
              {customer.deals.length === 0 && (
                <p className="text-sm text-muted-foreground">Сделок нет.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-display text-lg font-semibold text-primary">Заявки</h2>
            <div className="space-y-2">
              {customer.quotes.map((q: QuoteRel) => (
                <Link
                  key={q.id}
                  href={`/admin/quotes?quote=${q.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 transition-colors hover:border-signal/60"
                >
                  <p className="truncate text-sm text-primary">{q.name}</p>
                  <QuoteStatusBadge status={q.status} />
                </Link>
              ))}
              {customer.quotes.length === 0 && (
                <p className="text-sm text-muted-foreground">Заявок нет.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-display text-lg font-semibold text-primary">Заказы</h2>
            <div className="space-y-2">
              {orders.map((o) => {
                const meta = orderStatusMeta[o.status] ?? orderStatusMeta.NEW;
                const totalTiyn =
                  o.totalTiyn ?? o.items.reduce((sum, i) => sum + (i.amountTiyn ?? 0) * i.qty, 0);
                return (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 transition-colors hover:border-signal/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm text-primary">{o.number}</p>
                      {totalTiyn > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatTenge(tiynToTenge(totalTiyn))}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                        meta.className
                      )}
                    >
                      {meta.label}
                    </span>
                  </Link>
                );
              })}
              {orders.length === 0 && <p className="text-sm text-muted-foreground">Заказов нет.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
