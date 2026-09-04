import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { orderAdminRepository } from "@/server/repositories/admin";
import { OrderStatusSelect } from "@/components/admin/orders/order-status-select";
import { OrderDeliveryForm } from "@/components/admin/orders/order-delivery-form";
import { OrderDocumentsPanel } from "@/components/admin/orders/order-documents-panel";
import { formatTiyn } from "@/lib/money";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await orderAdminRepository.byId(id);
  if (!order) notFound();

  const totalTiyn =
    order.totalTiyn ?? order.items.reduce((sum, i) => sum + (i.amountTiyn ?? 0) * i.qty, 0);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> К списку заказов
      </Link>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-mono text-2xl font-bold text-primary">
              {order.number}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {order.customer && <span>Клиент: {order.customer.company}</span>}
              {order.user && <span>Портал: {order.user.name ?? order.user.email}</span>}
              {order.quote && (
                <Link
                  href={`/admin/quotes?quote=${order.quote.id}`}
                  className="hover:text-signal-700 hover:underline"
                >
                  КП: {order.quote.title ?? order.quote.company}
                </Link>
              )}
            </div>
          </div>
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h2 className="mb-3 font-display text-lg font-semibold text-primary">Позиции</h2>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="p-3 text-primary">
                        {item.title}
                        {item.sku && (
                          <span className="ml-1 text-xs text-muted-foreground">({item.sku})</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap p-3 text-muted-foreground">
                        {item.qty} {item.unit}
                      </td>
                      <td className="whitespace-nowrap p-3 text-right font-medium text-primary">
                        {item.amountTiyn !== null
                          ? formatTiyn(item.amountTiyn * item.qty)
                          : "по запросу"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-border bg-secondary/40 p-3">
                <span className="text-sm text-muted-foreground">Итого</span>
                <span className="font-display text-lg font-bold text-primary">
                  {formatTiyn(totalTiyn)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-display text-lg font-semibold text-primary">Документы</h2>
            <OrderDocumentsPanel orderId={order.id} initialDocuments={order.documents} />
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-primary">Доставка</h2>
          <div className="rounded-xl border border-border bg-card p-4">
            <OrderDeliveryForm
              orderId={order.id}
              initial={{
                carrier: order.carrier,
                trackingNumber: order.trackingNumber,
                estimatedDelivery: order.estimatedDelivery
                  ? order.estimatedDelivery.toISOString()
                  : null,
                actualDelivery: order.actualDelivery ? order.actualDelivery.toISOString() : null,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
