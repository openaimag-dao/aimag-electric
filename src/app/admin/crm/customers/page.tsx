import { AdminPageHeader } from "@/components/admin/page-header";
import {
  CustomersManager,
  type CustomerListRow,
} from "@/components/admin/crm/customers/customers-manager";
import { customerAdminRepository } from "@/server/repositories/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const [rows, managers] = await Promise.all([
    customerAdminRepository.list(),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const data: CustomerListRow[] = rows.map((c) => ({
    id: c.id,
    company: c.company,
    contact: c.contact,
    phone: c.phone,
    email: c.email,
    city: c.city,
    bin: c.bin,
    notes: c.notes,
    status: c.status,
    ownerId: c.ownerId,
    ownerName: c.owner?.name ?? c.owner?.email ?? null,
    dealCount: c._count?.deals ?? 0,
    quoteCount: c._count?.quotes ?? 0,
    activityCount: c._count?.activities ?? 0,
  }));

  const managerRefs = managers.map((m) => ({ id: m.id, label: m.name ?? m.email }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="CRM · Клиенты"
        description="База клиентов и лидов. Клик по компании открывает карточку с историей."
      />
      <CustomersManager rows={data} managers={managerRefs} />
    </div>
  );
}
