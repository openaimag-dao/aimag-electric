-- Quote gets an optional project/object title; QuoteItem gets a real
-- price snapshot (тиын, matching Price.amount) so a KP can be generated
-- from actual cart data instead of a free-text message.
ALTER TABLE "Quote" ADD COLUMN "title" TEXT;
ALTER TABLE "QuoteItem" ADD COLUMN "sku" TEXT;
ALTER TABLE "QuoteItem" ADD COLUMN "amountTiyn" INTEGER;
