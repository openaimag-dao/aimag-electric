import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";

import { getMyOrder } from "@/server/actions/order-actions";
import { orderStatusMeta, orderDocumentKindMeta } from "@/config/order-meta";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { formatTiyn, tiynToTenge } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types/cart";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await getMyOrder(id);
  if (!order) notFound();

  const meta = orderStatusMeta[order.status] ?? orderStatusMeta.NEW;
  const totalTiyn =
    order.totalTiyn ?? order.items.reduce((sum, i) => sum + (i.amountTiyn ?? 0) * i.qty, 0);

  // Only items still linked to a real catalog product can be honestly
  // prefilled — an item whose product was later removed has nothing to
  // re-add (see project-detail-client.tsx for the same filter/map pattern).
  const reorderItems: CartItem[] = order.items
    .filter((i) => i.productId && i.slug)
    .map((i) => ({
      productId: i.productId!,
      slug: i.slug!,
      sku: i.sku ?? "",
      title: i.title,
      unit: i.unit,
      priceTenge: i.amountTiyn !== null ? tiynToTenge(i.amountTiyn) : null,
      qty: i.qty,
    }));

  return (
    <div className="space-y-6">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> К списку заказов
      </Link>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display font-mono text-xl font-bold text-primary">{order.number}</h1>
          <div className="flex shrink-0 items-center gap-3">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", meta.className)}>
              {meta.label}
            </span>
            {reorderItems.length > 0 && (
              <QuoteDialog
                triggerLabel="Заказать повторно"
                variant="outline"
                size="sm"
                items={reorderItems}
                defaultTitle={`Повторный заказ ${order.number}`}
              />
            )}
          </div>
        </div>
        {(order.carrier || order.trackingNumber || order.estimatedDelivery) && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {order.carrier && <span>Перевозчик: {order.carrier}</span>}
            {order.trackingNumber && <span>Трек-номер: {order.trackingNumber}</span>}
            {order.estimatedDelivery && (
              <span>
                Ожидаемая доставка: {new Date(order.estimatedDelivery).toLocaleDateString("ru-RU")}
              </span>
            )}
            {order.actualDelivery && (
              <span>Доставлено: {new Date(order.actualDelivery).toLocaleDateString("ru-RU")}</span>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-primary">Позиции</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.sku && <>Арт. {item.sku} · </>}
                    {item.qty} {item.unit}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary">
                  {item.amountTiyn !== null ? formatTiyn(item.amountTiyn * item.qty) : "по запросу"}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border bg-secondary/40 p-3">
            <span className="text-sm text-muted-foreground">Итого</span>
            <span className="font-display text-lg font-bold text-primary">
              {formatTiyn(totalTiyn)}
            </span>
          </div>
        </div>
      </div>

      {order.documents.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-primary">Документы</h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {order.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 p-3 hover:bg-secondary/40"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {orderDocumentKindMeta[doc.kind] ?? doc.kind}
                      {doc.size && ` · ${doc.size}`}
                    </p>
                  </div>
                </div>
                <Download className="size-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
