import { QuoteDialog } from "@/components/common/quote-dialog";
import type { ProductDetailDTO } from "@/server/dto";

/**
 * Replaces the old customer-review section — this catalog has no real
 * review data (product.reviews is always empty save for a handful of admin
 * test rows), so a review list is more empty state than feature. Routes the
 * same question straight to an engineer instead, via the existing КП flow,
 * pre-filled with this product so nothing has to be re-typed.
 */
export function AskEngineer({ product }: { product: ProductDetailDTO }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5">
      <p className="max-w-md text-sm text-muted-foreground">
        Подскажем совместимость, поможем подобрать аналог и уточним сроки поставки — напишите
        инженеру, он свяжется с вами.
      </p>
      <div className="ml-auto">
        <QuoteDialog
          variant="outline"
          triggerLabel="Задать вопрос инженеру"
          defaultMessage={`Вопрос по товару «${product.title}» (арт. ${product.sku}):`}
          items={[
            {
              productId: product.id,
              slug: product.slug,
              sku: product.sku,
              title: product.title,
              unit: product.unit,
              priceTenge: product.price,
              qty: 1,
            },
          ]}
        />
      </div>
    </div>
  );
}
