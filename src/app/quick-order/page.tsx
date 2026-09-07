import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { QuickOrderView } from "@/components/quick-order/quick-order-view";

export const metadata: Metadata = {
  title: "Быстрый заказ",
  description: "Вставьте список артикулов и количества — соберём позиции из каталога в корзину.",
  robots: { index: false, follow: true },
};

export default function QuickOrderPage() {
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
            <span className="font-medium text-primary">Быстрый заказ</span>
          </nav>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Быстрый заказ
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Уже знаете нужные артикулы? Вставьте список — найдём позиции в каталоге и добавим в
            корзину одним нажатием.
          </p>
        </div>
      </div>

      <div className="container py-8">
        <QuickOrderView />
      </div>
    </div>
  );
}
