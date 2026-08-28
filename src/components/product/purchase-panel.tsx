import { Clock, Download, ShieldCheck, Truck, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductPrice } from "@/components/catalog/product-price";
import { AvailabilityBadge } from "@/components/catalog/availability-badge";
import { WhatsAppButton } from "@/components/product/whatsapp-button";
import { formatTenge } from "@/lib/money";
import type { ProductDetail } from "@/types/product-detail";

/** Right-hand purchase panel: price, availability, lead time, and 3 CTAs. */
export function PurchasePanel({
  product,
  companyPriceTenge = null,
}: {
  product: ProductDetail;
  /** This company's negotiated reference price for this product, if the viewer is a logged-in member of a company that has one set — never fabricated, only ever a real staff-entered CompanyPrice row. */
  companyPriceTenge?: number | null;
}) {
  const primaryDoc = product.documents[0];

  const facts = [
    { icon: Clock, label: "Срок поставки", value: product.leadTime },
    { icon: Truck, label: "Доставка", value: "По всему Казахстану" },
    { icon: ShieldCheck, label: "Гарантия", value: product.warranty },
    product.packaging ? { icon: Package, label: "Отгрузка", value: product.packaging } : null,
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <AvailabilityBadge status={product.availability} />
        <span className="font-mono text-xs text-muted-foreground">Арт. {product.sku}</span>
      </div>

      <div className="mt-4">
        <ProductPrice price={product.price} unit={product.unit} className="text-3xl" />
        {product.price !== null && (
          <p className="mt-1 text-xs text-muted-foreground">
            Цена указана без НДС. Точную стоимость под объём — в КП.
          </p>
        )}
        {companyPriceTenge !== null && (
          <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Ваша цена по договору:{" "}
            <span className="font-semibold">{formatTenge(companyPriceTenge)}</span>
          </p>
        )}
      </div>

      <Separator className="my-5" />

      <dl className="space-y-3">
        {facts.map((fact) => {
          const Icon = fact.icon;
          return (
            <div key={fact.label} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-signal-700">
                <Icon className="size-4" />
              </span>
              <div>
                <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                <dd className="text-sm font-medium text-primary">{fact.value}</dd>
              </div>
            </div>
          );
        })}
      </dl>

      <Separator className="my-5" />

      {/* Actions */}
      <div className="flex flex-col gap-2.5">
        <QuoteDialog
          size="lg"
          triggerLabel="Получить КП"
          className="w-full"
          items={[
            {
              productId: product.id,
              slug: product.slug,
              sku: product.sku,
              title: product.title,
              unit: product.unit,
              // A quote requested straight from this panel is a single,
              // immediate submission — safe to quote at the viewer's company
              // price. AddToCartButton below deliberately still uses the
              // catalog price: the cart is persisted and mergeable across
              // several other add-to-cart entry points (catalog grid,
              // compare, account) that don't resolve company pricing yet, so
              // applying it only here would let whichever entry point a
              // customer touches first silently decide their price — see
              // ROADMAP.md for the deferred cart-wide follow-up.
              priceTenge: companyPriceTenge ?? product.price,
              qty: 1,
            },
          ]}
        />
        <AddToCartButton
          size="lg"
          className="w-full"
          product={{
            productId: product.id,
            slug: product.slug,
            sku: product.sku,
            title: product.title,
            unit: product.unit,
            priceTenge: product.price,
          }}
        />
        <WhatsAppButton title={product.title} sku={product.sku} className="w-full" />
        {primaryDoc && (
          <Button asChild variant="outline" size="lg" className="w-full">
            <a href={primaryDoc.href} download>
              <Download />
              Скачать PDF
            </a>
          </Button>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Работаем с ТОО, ИП и квазигосударственным сектором
      </p>
    </div>
  );
}
