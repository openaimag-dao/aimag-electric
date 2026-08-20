import { AdminPageHeader } from "@/components/admin/page-header";
import {
  AttributesManager,
  type AttributeListRow,
} from "@/components/admin/attributes/attributes-manager";
import { attributeAdminRepository } from "@/server/repositories/admin";

export const dynamic = "force-dynamic";

export default async function AdminAttributesPage() {
  const rows = await attributeAdminRepository.list();
  const data: AttributeListRow[] = rows.map((a) => ({
    id: a.id,
    key: a.key,
    name: a.name,
    type: a.type,
    unit: a.unit,
    filterable: a.filterable,
    order: a.order,
    valueCount: a._count?.values ?? 0,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Характеристики"
        description="Атрибуты товаров (материал, сечение и т.п.) — новая характеристика сразу появляется в фильтрах каталога, если у товаров заданы значения."
      />
      <AttributesManager rows={data} />
    </div>
  );
}
