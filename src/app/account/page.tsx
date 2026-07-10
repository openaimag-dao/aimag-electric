import Link from "next/link";
import { FileText, Briefcase, CheckSquare, Users, ArrowRight, Building2 } from "lucide-react";

import { currentUser, isStaff } from "@/server/auth/session";
import { accountRepository } from "@/server/repositories/account-repository";
import { quoteStatusMeta } from "@/components/admin/quote-status-badge";
import { dealStageMeta } from "@/config/crm-meta";
import { tiynToTenge, formatTenge } from "@/lib/money";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) return null;

  return isStaff(user.role) ? (
    <StaffDashboard userId={user.id} />
  ) : (
    <CustomerDashboard userId={user.id} />
  );
}

async function CustomerDashboard({ userId }: { userId: string }) {
  const [customers, directQuotes] = await Promise.all([
    accountRepository.customerData(userId),
    accountRepository.quotesByUser(userId),
  ]);

  const deals = customers.flatMap((c) => c.deals);
  // Merge quotes from linked customer profiles and direct submissions, deduped.
  const quoteMap = new Map<string, (typeof directQuotes)[number]>();
  for (const q of directQuotes) quoteMap.set(q.id, q);
  for (const c of customers) for (const q of c.quotes) quoteMap.set(q.id, q);
  const quotes = Array.from(quoteMap.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const openDeals = deals.filter((d) => d.stage !== "WON" && d.stage !== "LOST").length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={FileText} label="Заявки" value={quotes.length} />
        <StatCard icon={Briefcase} label="Сделки в работе" value={openDeals} />
        <StatCard icon={CheckSquare} label="Всего сделок" value={deals.length} />
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-primary">Мои заявки</h2>
        {quotes.length === 0 ? (
          <EmptyState text="У вас пока нет заявок." href="/catalog" cta="Перейти в каталог" />
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {quotes.map((q) => {
              const meta = quoteStatusMeta[q.status] ?? quoteStatusMeta.NEW;
              return (
                <div key={q.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary">
                      {q.items.length > 0 ? q.items[0].title : "Заявка"}
                      {q.items.length > 1 && ` +${q.items.length - 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {q.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", meta.className)}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-primary">Мои сделки</h2>
        {deals.length === 0 ? (
          <EmptyState text="Активных сделок нет." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {deals.map((d) => {
              const meta = dealStageMeta[d.stage] ?? dealStageMeta.NEW;
              return (
                <div key={d.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-primary">{d.title}</p>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", meta.className)}>
                      {meta.label}
                    </span>
                  </div>
                  {d.amount !== null && (
                    <p className="mt-2 font-mono text-sm text-muted-foreground">
                      {formatTenge(tiynToTenge(d.amount))}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

async function StaffDashboard({ userId }: { userId: string }) {
  const { ownedCustomers, ownedDeals, openTasks } = await accountRepository.staffWorkload(userId);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Мои клиенты" value={ownedCustomers} />
        <StatCard icon={Briefcase} label="Мои сделки в работе" value={ownedDeals.length} />
        <StatCard icon={CheckSquare} label="Открытые задачи" value={openTasks} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-primary">Мои сделки</h2>
          <Link
            href="/admin/crm/deals"
            className="inline-flex items-center gap-1 text-sm font-medium text-signal-700 hover:underline"
          >
            Вся воронка <ArrowRight className="size-4" />
          </Link>
        </div>
        {ownedDeals.length === 0 ? (
          <EmptyState text="За вами не закреплены активные сделки." href="/admin/crm/deals" cta="Открыть CRM" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {ownedDeals.map((d) => {
              const meta = dealStageMeta[d.stage] ?? dealStageMeta.NEW;
              return (
                <div key={d.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-primary">{d.title}</p>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", meta.className)}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="size-3" /> {d.customer.company}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" /> {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-primary">{value}</div>
    </div>
  );
}

function EmptyState({ text, href, cta }: { text: string; href?: string; cta?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {href && cta && (
        <Link
          href={href}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-signal-700 hover:underline"
        >
          {cta} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
