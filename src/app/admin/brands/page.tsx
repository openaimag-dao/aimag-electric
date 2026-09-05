import { AdminPageHeader } from "@/components/admin/page-header";
import { BrandsManager, type BrandListRow } from "@/components/admin/brands/brands-manager";
import { brandAdminRepository } from "@/server/repositories/admin";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const rows = await brandAdminRepository.list();
  const data: BrandListRow[] = rows.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    origin: b.origin,
    productCount: b._count?.products ?? 0,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Производители"
        description="Бренды каталога. Производителя с товарами удалить нельзя."
      />
      <BrandsManager rows={data} />
    </div>
  );
}
