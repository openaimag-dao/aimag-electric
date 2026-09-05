import { AdminPageHeader } from "@/components/admin/page-header";
import {
  DocumentsManager,
  type DocumentListRow,
} from "@/components/admin/documents/documents-manager";
import { documentAdminRepository } from "@/server/repositories/admin";
import { adminService } from "@/server/services/admin-service";

export const dynamic = "force-dynamic";

export default async function AdminDocumentsPage() {
  const [rows, refs] = await Promise.all([documentAdminRepository.list(), adminService.refs()]);

  const data: DocumentListRow[] = rows.map((d) => ({
    id: d.id,
    productId: d.productId,
    title: d.title,
    kind: d.kind,
    url: d.url,
    size: d.size,
    order: d.order,
    productTitle: d.product.title,
    productSku: d.product.sku,
  }));

  const products = refs.products.map((p) => ({ id: p.id, label: `${p.title} (${p.sku})` }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Документы"
        description="Паспорта, сертификаты, инструкции и чертежи товаров (PDF)."
      />
      <DocumentsManager rows={data} products={products} />
    </div>
  );
}
