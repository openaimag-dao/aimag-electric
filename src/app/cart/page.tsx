import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Проект",
  description: "Собранные товары для коммерческого предложения.",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <div className="bg-secondary/20">
      <div className="border-b border-border bg-background">
        <div className="container py-8">
          <nav
            aria-label="Навигационная цепочка"
            className="flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Link href="/" className="hover:text-primary">
              Главная
            </Link>
            <ChevronRight className="size-4" />
            <span className="font-medium text-primary">Проект</span>
          </nav>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Проект
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Товары, добавленные из каталога. Проверьте количество и запросите одно коммерческое
            предложение на все позиции.
          </p>
        </div>
      </div>

      <div className="container py-8">
        <CartView />
      </div>
    </div>
  );
}
