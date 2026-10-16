import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch } from "lucide-react";

import { getMyOrders } from "@/server/actions/order-actions";
import { orderStatusMeta } from "@/config/order-meta";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { tiynToTenge, formatTenge } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types/cart";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Заказы",
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const orders = await getMyOrders();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-primary">Заказы</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-secondary text-steel-500">
            <PackageSearch className="size-7" />
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold text-primary">Заказов пока нет</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Заказ появится здесь после того, как вы одобрите коммерческое предложение и менеджер
            оформит заказ.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const meta = orderStatusMeta[order.status] ?? orderStatusMeta.NEW;
            const totalTiyn =
              order.totalTiyn ??
              order.items.reduce((sum, i) => sum + (i.amountTiyn ?? 0) * i.qty, 0);
            // Same honest-reorder filter as the order detail page: only items
            // still linked to a real catalog product can be prefilled.
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
              <div
                key={order.id}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-signal/60"
              >
                <Link href={`/account/orders/${order.id}`} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display font-mono text-sm font-semibold text-primary">
                      {order.number}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                        meta.className
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{order.items.length} позиций</span>
                    <span className="font-medium text-primary">
                      {totalTiyn > 0 ? formatTenge(tiynToTenge(totalTiyn)) : "—"}
                    </span>
                  </div>
                </Link>
                {reorderItems.length > 0 && (
                  <QuoteDialog
                    triggerLabel="Заказать повторно"
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    items={reorderItems}
                    defaultTitle={`Повторный заказ ${order.number}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
