import { AdminPageHeader } from "@/components/admin/page-header";
import {
  CategoriesManager,
  type CategoryListRow,
} from "@/components/admin/categories/categories-manager";
import { categoryAdminRepository } from "@/server/repositories/admin";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const rows = await categoryAdminRepository.list();
  const data: CategoryListRow[] = rows.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    spec: c.spec,
    icon: c.icon,
    order: c.order,
    productCount: c._count?.products ?? 0,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Категории"
        description="Разделы каталога. Категорию с товарами удалить нельзя."
      />
      <CategoriesManager rows={data} />
    </div>
  );
}
