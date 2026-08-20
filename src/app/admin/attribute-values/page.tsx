import { AdminPageHeader } from "@/components/admin/page-header";
import {
  AttributeValuesManager,
  type AttributeValueListRow,
} from "@/components/admin/attribute-values/attribute-values-manager";
import { attributeValueAdminRepository } from "@/server/repositories/admin";
import { adminService } from "@/server/services/admin-service";

export const dynamic = "force-dynamic";

function displayValue(row: {
  valueString: string | null;
  valueNumber: number | null;
  valueBool: boolean | null;
}) {
  if (row.valueNumber !== null) return String(row.valueNumber);
  if (row.valueBool !== null) return row.valueBool ? "Да" : "Нет";
  return row.valueString ?? "";
}

export default async function AdminAttributeValuesPage() {
  const [rows, refs] = await Promise.all([
    attributeValueAdminRepository.list(),
    adminService.refs(),
  ]);

  const data: AttributeValueListRow[] = rows.map((v) => ({
    id: v.id,
    productId: v.productId,
    attributeId: v.attributeId,
    value: displayValue(v),
    productTitle: v.product.title,
    productSku: v.product.sku,
    attributeName: v.attribute.name,
    attributeUnit: v.attribute.unit,
  }));

  const products = refs.products.map((p) => ({ id: p.id, label: `${p.title} (${p.sku})` }));
  const attributes = refs.attributes.map((a) => ({
    id: a.id,
    label: a.unit ? `${a.name} (${a.unit})` : a.name,
    unit: a.unit,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Значения характеристик"
        description="Значения атрибутов по товарам — их набор формирует фильтры каталога для каждой категории."
      />
      <AttributeValuesManager rows={data} products={products} attributes={attributes} />
    </div>
  );
}
