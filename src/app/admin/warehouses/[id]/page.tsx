import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { warehouseAdminRepository } from "@/server/repositories/admin";
import {
  WarehouseStockList,
  type WarehouseStockRow,
} from "@/components/admin/warehouses/warehouse-stock-list";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WarehouseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const warehouse = await warehouseAdminRepository.byIdWithStock(id);
  if (!warehouse) notFound();

  const rows: WarehouseStockRow[] = warehouse.stock.map((s) => ({
    id: s.id,
    productId: s.product.id,
    slug: s.product.slug,
    sku: s.product.sku,
    title: s.product.title,
    unit: s.product.unit,
    quantity: s.quantity,
    restockAt: s.restockAt ? s.restockAt.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/warehouses"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> К списку складов
      </Link>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="muted" className="font-mono">
            {warehouse.code}
          </Badge>
          <h1 className="font-display text-2xl font-bold text-primary">{warehouse.name}</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{warehouse.city}</p>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-primary">Остатки</h2>
        <WarehouseStockList warehouseId={warehouse.id} rows={rows} />
      </div>
    </div>
  );
}
