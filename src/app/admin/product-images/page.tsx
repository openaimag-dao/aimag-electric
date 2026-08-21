import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ProductImagesManager,
  type ProductImageListRow,
} from "@/components/admin/product-images/product-images-manager";
import { productImageAdminRepository } from "@/server/repositories/admin";
import { adminService } from "@/server/services/admin-service";

export const dynamic = "force-dynamic";

export default async function AdminProductImagesPage() {
  const [rows, refs] = await Promise.all([productImageAdminRepository.list(), adminService.refs()]);

  const data: ProductImageListRow[] = rows.map((img) => ({
    id: img.id,
    productId: img.productId,
    url: img.url ?? "",
    alt: img.alt,
    order: img.order,
    productTitle: img.product.title,
    productSku: img.product.sku,
  }));

  const products = refs.products.map((p) => ({ id: p.id, label: `${p.title} (${p.sku})` }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Фото товаров"
        description="Фотографии по товарам. Первое по порядку (0) — главное фото на карточке и странице товара."
      />
      <ProductImagesManager rows={data} products={products} />
    </div>
  );
}
