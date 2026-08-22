import { AdminPageHeader } from "@/components/admin/page-header";
import { OrdersManager, type OrderListRow } from "@/components/admin/orders/orders-manager";
import { orderAdminRepository } from "@/server/repositories/admin";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const rows = await orderAdminRepository.list();
  const data: OrderListRow[] = rows.map((o) => ({
    id: o.id,
    number: o.number,
    status: o.status,
    trackingNumber: o.trackingNumber,
    itemCount: o._count?.items ?? 0,
    totalTiyn: o.totalTiyn ?? o.items.reduce((sum, i) => sum + (i.amountTiyn ?? 0) * i.qty, 0),
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Заказы"
        description="Заказы, созданные из одобренных КП. Статус, доставка, документы — на странице заказа."
      />
      <OrdersManager rows={data} />
    </div>
  );
}
