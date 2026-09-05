import { AdminPageHeader } from "@/components/admin/page-header";
import { PricesManager, type PriceListRow } from "@/components/admin/prices/prices-manager";
import { priceAdminRepository } from "@/server/repositories/admin";
import { adminService } from "@/server/services/admin-service";
import { tiynToTenge } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminPricesPage() {
  const [rows, refs] = await Promise.all([priceAdminRepository.list(), adminService.refs()]);

  const data: PriceListRow[] = rows.map((p) => ({
    id: p.id,
    productId: p.productId,
    kind: p.kind,
    amountTenge: p.amount === null ? "" : tiynToTenge(p.amount),
    minQty: p.minQty,
    productTitle: p.product.title,
    productSku: p.product.sku,
    unit: p.product.unit,
  }));

  const products = refs.products.map((p) => ({ id: p.id, label: `${p.title} (${p.sku})` }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Цены"
        description="Базовые, оптовые и акционные цены. Хранятся в тиынах, отображаются в тенге."
      />
      <PricesManager rows={data} products={products} />
    </div>
  );
}
