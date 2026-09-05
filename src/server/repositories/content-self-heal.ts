import "server-only";

import { tableSelfHeal } from "@/lib/db-self-heal";

/** Post and CaseStudy are brand-new tables — this DB has no tracked migration history, so they're created at runtime on first query. */
export const withPostTable = tableSelfHeal([
  `CREATE TABLE IF NOT EXISTS "Post" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "readingTime" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Post_slug_key" ON "Post"("slug")`,
  `CREATE INDEX IF NOT EXISTS "Post_published_publishedAt_idx" ON "Post"("published", "publishedAt")`,
]);

export const withCaseStudyTable = tableSelfHeal([
  `CREATE TABLE IF NOT EXISTS "CaseStudy" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "metricLabel" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CaseStudy_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CaseStudy_slug_key" ON "CaseStudy"("slug")`,
  `CREATE INDEX IF NOT EXISTS "CaseStudy_published_order_idx" ON "CaseStudy"("published", "order")`,
]);
