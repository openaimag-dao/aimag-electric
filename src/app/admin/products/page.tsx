import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ProductsManager,
  type ProductListRow,
} from "@/components/admin/products/products-manager";
import { productAdminRepository } from "@/server/repositories/admin";
import { adminService } from "@/server/services/admin-service";
import { formatTengePerUnit, tiynToTenge } from "@/lib/money";
import { deriveAvailabilityFromStock } from "@/lib/availability";

export const dynamic = "force-dynamic";

function priceLabel(prices: { kind: string; amount: number | null }[], unit: string): string {
  const base = prices.find((p) => p.kind === "BASE") ?? prices[0];
  if (!base || base.amount === null) return "по запросу";
  return formatTengePerUnit(tiynToTenge(base.amount), unit);
}



export default async function AdminProductsPage() {
  const [rows, refs] = await Promise.all([
    productAdminRepository.list(),
    adminService.refs(),
  ]);

  const data: ProductListRow[] = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    title: p.title,
    description: p.description,
    unit: p.unit,
    packaging: p.packaging,
    warranty: p.warranty,
    leadTime: p.leadTime,
    badge: p.badge,
    popularity: p.popularity,
    published: p.published,
    categoryId: p.categoryId,
    brandId: p.brandId,
    categoryTitle: p.category.title,
    brandName: p.brand.name,
    priceLabel: priceLabel(p.prices, p.unit),
    availability: deriveAvailabilityFromStock(p.stock),
  }));

  const categories = refs.categories.map((c) => ({ id: c.id, label: c.title }));
  const brands = refs.brands.map((b) => ({ id: b.id, label: b.name }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Товары"
        description={`${rows.length} позиций в каталоге. Цена и наличие — из разделов «Цены» и «Склады».`}
      />
      <ProductsManager rows={data} categories={categories} brands={brands} />
    </div>
  );
}
