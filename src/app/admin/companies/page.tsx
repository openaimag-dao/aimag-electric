import { AdminPageHeader } from "@/components/admin/page-header";
import {
  CompaniesManager,
  type CompanyListRow,
} from "@/components/admin/companies/companies-manager";
import { companyAdminRepository } from "@/server/repositories/admin";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage() {
  const rows = await companyAdminRepository.list();
  const data: CompanyListRow[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    bin: c.bin,
    legalAddress: c.legalAddress,
    actualAddress: c.actualAddress,
    phone: c.phone,
    email: c.email,
    notes: c.notes,
    memberCount: c._count?.members ?? 0,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Компании"
        description="B2B-организации клиентов: реквизиты и сотрудники с доступом в личный кабинет."
      />
      <CompaniesManager rows={data} />
    </div>
  );
}
