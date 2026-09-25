-- Production uses the existing idempotent withQuoteColumns schema repair.
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "utmSource" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT;
