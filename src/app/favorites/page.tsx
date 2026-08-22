import type { Metadata } from "next";

import { FavoritesPageClient } from "@/components/favorites/favorites-page-client";

export const metadata: Metadata = {
  title: "Избранное",
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return <FavoritesPageClient />;
}
