import type { Metadata } from "next";

import { catalogService } from "@/server/services/catalog-service";
import { ComparePageClient } from "@/components/compare/compare-page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Сравнение товаров",
  robots: { index: false, follow: false },
};

export default async function ComparePage() {
  const attributeDefs = await catalogService.loadAttributes();
  return <ComparePageClient attributeDefs={attributeDefs} />;
}
