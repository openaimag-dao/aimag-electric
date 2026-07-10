import { AdminPageHeader } from "@/components/admin/page-header";
import { DealsBoard, type DealCard } from "@/components/admin/crm/deals/deals-board";
import { crmService } from "@/server/services/crm-service";
import { dealAdminRepository } from "@/server/repositories/admin";
import { prisma } from "@/lib/prisma";
import { tiynToTenge, formatTenge } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminDealsPage() {
  const [deals, pipeline, customers, managers] = await Promise.all([
    dealAdminRepository.board(),
    crmService.pipeline(),
    prisma.customer.findMany({ select: { id: true, company: true }, orderBy: { company: "asc" } }),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] } },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const cards: DealCard[] = deals.map((d) => ({
    id: d.id,
    title: d.title,
    customerId: d.customerId,
    customerName: d.customer.company,
    stage: d.stage,
    amountTenge: d.amount === null ? null : tiynToTenge(d.amount),
    probability: d.probability,
    ownerName: d.owner?.name ?? null,
    expectedAt: d.expectedAt ? d.expectedAt.toISOString() : null,
    lostReason: d.lostReason,
  }));

  const customerRefs = customers.map((c) => ({ id: c.id, label: c.company }));
  const managerRefs = managers.map((m) => ({ id: m.id, label: m.name ?? m.email }));

  const openValue = pipeline
    .filter((p) => p.stage !== "WON" && p.stage !== "LOST")
    .reduce((s, p) => s + p.valueTenge, 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="CRM · Воронка сделок"
        description={`В работе: ${formatTenge(openValue)}. Перетаскивайте карточки между стадиями.`}
      />
      <DealsBoard deals={cards} customers={customerRefs} managers={managerRefs} />
    </div>
  );
}
