import { AdminPageHeader } from "@/components/admin/page-header";
import { QuotesManager, type QuoteListRow } from "@/components/admin/quotes/quotes-manager";
import { quoteAdminRepository, orderAdminRepository } from "@/server/repositories/admin";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const [rows, quoteIdsWithOrders] = await Promise.all([
    quoteAdminRepository.list(),
    orderAdminRepository.quoteIdsWithOrders(),
  ]);
  const data: QuoteListRow[] = rows.map((q) => ({
    id: q.id,
    title: q.title,
    company: q.company,
    name: q.name,
    phone: q.phone,
    email: q.email,
    message: q.message,
    status: q.status,
    createdAt: q.createdAt.toISOString(),
    approvalToken: q.approvalToken,
    respondedAt: q.respondedAt ? q.respondedAt.toISOString() : null,
    responseNote: q.responseNote,
    hasOrder: quoteIdsWithOrders.has(q.id),
    items: q.items.map((i) => ({
      id: i.id,
      title: i.title,
      sku: i.sku,
      qty: i.qty,
      unit: i.unit,
      amountTiyn: i.amountTiyn,
    })),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Заявки"
        description="Входящие запросы на КП. Меняйте статус кликом по бейджу."
      />
      <QuotesManager rows={data} />
    </div>
  );
}
