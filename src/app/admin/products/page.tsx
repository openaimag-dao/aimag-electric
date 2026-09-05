import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductsManager, type ProductListRow } from "@/components/admin/products/products-manager";
import { productAdminRepository } from "@/server/repositories/admin";
import { adminService } from "@/server/services/admin-service";
import { formatTengePerUnit, tiynToTenge } from "@/lib/money";
import { deriveAvailabilityFromStock } from "@/lib/availability";
import { parseAdminProductsQuery, ADMIN_PRODUCTS_PAGE_SIZE } from "@/lib/admin/products-url";

export const dynamic = "force-dynamic";

function priceLabel(prices: { kind: string; amount: number | null }[], unit: string): string {
  const base = prices.find((p) => p.kind === "BASE") ?? prices[0];
  if (!base || base.amount === null) return "по запросу";
  return formatTengePerUnit(tiynToTenge(base.amount), unit);
}

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const query = parseAdminProductsQuery(new URLSearchParams(sp as Record<string, string>));

  const [{ rows, total }, refs] = await Promise.all([
    productAdminRepository.listPage({
      page: query.page,
      pageSize: ADMIN_PRODUCTS_PAGE_SIZE,
      q: query.q || undefined,
      categoryId: query.category || undefined,
      brandId: query.brand || undefined,
      published:
        query.status === "published" ? true : query.status === "hidden" ? false : undefined,
      quality: query.quality || undefined,
    }),
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
    isFeatured: p.isFeatured,
    categoryId: p.categoryId,
    brandId: p.brandId,
    categoryTitle: p.category.title,
    brandName: p.brand.name,
    priceLabel: priceLabel(p.prices, p.unit),
    availability: deriveAvailabilityFromStock(p.stock),
  }));

  const categories = refs.categories.map((c) => ({ id: c.id, label: c.title }));
  const brands = refs.brands.map((b) => ({ id: b.id, label: b.name }));
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PRODUCTS_PAGE_SIZE));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Товары"
        description={`${total} позиций в каталоге. Цена и наличие — из разделов «Цены» и «Склады».`}
      />
      <ProductsManager
        rows={data}
        categories={categories}
        brands={brands}
        total={total}
        page={query.page}
        pageCount={pageCount}
      />
    </div>
  );
}
