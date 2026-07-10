import { AdminPageHeader } from "@/components/admin/page-header";
import {
  WarehousesManager,
  type WarehouseListRow,
} from "@/components/admin/warehouses/warehouses-manager";
import { warehouseAdminRepository } from "@/server/repositories/admin";

export const dynamic = "force-dynamic";

export default async function AdminWarehousesPage() {
  const rows = await warehouseAdminRepository.list();
  const data: WarehouseListRow[] = rows.map((w) => ({
    id: w.id,
    code: w.code,
    name: w.name,
    city: w.city,
    stockCount: w._count?.stock ?? 0,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Склады"
        description="Точки хранения. Наличие товаров считается по остаткам на складах."
      />
      <WarehousesManager rows={data} />
    </div>
  );
}
