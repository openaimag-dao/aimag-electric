import type { Metadata } from "next";

import { SharedCartLoader } from "@/components/cart/shared-cart-loader";

export const metadata: Metadata = {
  title: "Открыть проект по ссылке",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function SharedCartPage({ params }: PageProps) {
  const { code } = await params;
  return (
    <div className="container py-8">
      <SharedCartLoader code={code} />
    </div>
  );
}
