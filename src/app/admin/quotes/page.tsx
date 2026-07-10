import { AdminPageHeader } from "@/components/admin/page-header";
import {
  QuotesManager,
  type QuoteListRow,
} from "@/components/admin/quotes/quotes-manager";
import { quoteAdminRepository } from "@/server/repositories/admin";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const rows = await quoteAdminRepository.list();
  const data: QuoteListRow[] = rows.map((q) => ({
    id: q.id,
    company: q.company,
    name: q.name,
    phone: q.phone,
    email: q.email,
    message: q.message,
    status: q.status,
    createdAt: q.createdAt.toISOString(),
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
