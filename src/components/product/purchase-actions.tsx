"use client";

import { useState } from "react";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { QuantityInput } from "@/components/catalog/quantity-input";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { WhatsAppButton } from "@/components/product/whatsapp-button";
import { formatTenge } from "@/lib/money";
import type { CartItem } from "@/types/cart";

/** One quantity for all ways of requesting the product. */
export function PurchaseActions({ product }: { product: Omit<CartItem, "qty"> }) {
  const [qty, setQty] = useState(1);

  return (
    <div className="flex flex-col gap-2.5" role="group" aria-label="Заказать товар">
      <p className="text-sm font-medium text-primary">Количество</p>
      <QuantityInput value={qty} onChange={setQty} unit={product.unit} className="w-full" />
      <div className="rounded-lg bg-secondary/50 p-3" role="status" aria-label="Расчёт стоимости">
        <p className="text-xs text-muted-foreground">
          Предварительная сумма за {qty} {product.unit}
        </p>
        <p className="mt-1 text-lg font-semibold tabular-nums text-primary">
          {product.priceTenge === null
            ? "Стоимость по запросу"
            : formatTenge(Math.round(product.priceTenge * qty * 100) / 100)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {product.priceTenge === null
            ? "Укажем цену и срок поставки в коммерческом предложении."
            : "Без НДС и доставки. Итоговую стоимость подтвердим в КП."}
        </p>
      </div>
      <QuoteDialog
        size="lg"
        triggerLabel="Получить КП"
        className="w-full"
        items={[{ ...product, qty }]}
      />
      <AddToCartButton size="lg" className="w-full" qty={qty} product={product} />
      <WhatsAppButton
        title={product.title}
        sku={product.sku}
        qty={qty}
        unit={product.unit}
        className="w-full"
      />
    </div>
  );
}
