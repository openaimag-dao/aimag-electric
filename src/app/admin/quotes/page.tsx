import { AdminPageHeader } from "@/components/admin/page-header";
import { QuotesManager, type QuoteListRow } from "@/components/admin/quotes/quotes-manager";
import {
  quoteAdminRepository,
  orderAdminRepository,
  companyAdminRepository,
  companyPriceAdminRepository,
} from "@/server/repositories/admin";
import { tiynToTenge } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const [rows, quoteIdsWithOrders] = await Promise.all([
    quoteAdminRepository.list(),
    orderAdminRepository.quoteIdsWithOrders(),
  ]);

  // Resolve each quote's company through the real Quote.userId → CompanyMember
  // relation only — never guessed from the quote's free-text `company` label
  // (see the comment on Quote in schema.prisma). Unresolved quotes (no user,
  // or a user not on any company) simply get no suggested prices — a silent,
  // expected no-op, not an error.
  const userIds = [...new Set(rows.map((q) => q.userId).filter((v): v is string => Boolean(v)))];
  const memberships = await companyAdminRepository.forUsers(userIds);
  const companyByUserId = new Map(memberships.map((m) => [m.userId, m.company]));

  const companyIds = [...new Set(memberships.map((m) => m.companyId))];
  const productIds = [
    ...new Set(
      rows.flatMap((q) => q.items.map((i) => i.productId).filter((v): v is string => Boolean(v)))
    ),
  ];
  const companyPrices = await companyPriceAdminRepository.forCompaniesAndProducts(
    companyIds,
    productIds
  );
  const suggestedPriceTenge = new Map(
    companyPrices.map((cp) => [`${cp.companyId}:${cp.productId}`, tiynToTenge(cp.amountTiyn)])
  );

  const data: QuoteListRow[] = rows.map((q) => {
    const resolvedCompany = q.userId ? (companyByUserId.get(q.userId) ?? null) : null;
    return {
      id: q.id,
      title: q.title,
      company: q.company,
      resolvedCompanyName: resolvedCompany?.name ?? null,
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
      customerId: q.customer?.id ?? null,
      ownerName: q.customer?.owner?.name ?? q.customer?.owner?.email ?? null,
      attachments: q.attachments.map((a) => ({
        id: a.id,
        url: a.url,
        filename: a.filename,
        size: a.size,
      })),
      items: q.items.map((i) => ({
        id: i.id,
        title: i.title,
        sku: i.sku,
        qty: i.qty,
        unit: i.unit,
        amountTiyn: i.amountTiyn,
        note: i.note,
        suggestedPriceTenge:
          resolvedCompany && i.productId
            ? (suggestedPriceTenge.get(`${resolvedCompany.id}:${i.productId}`) ?? null)
            : null,
      })),
    };
  });

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
