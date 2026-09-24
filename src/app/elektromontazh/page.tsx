import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { QuoteForm } from "@/components/common/quote-form";

export const metadata: Metadata = {
  title: "Электромонтажные работы под ключ — AIMAG ELECTRIC",
  description:
    "AIMAG ELECTRIC принимает заявки на электромонтажные работы под ключ для объектов любой сложности. Расскажите о проекте — обсудим состав работ, сроки и стоимость.",
  alternates: { canonical: "/elektromontazh" },
};

export default function ElectricalInstallationPage() {
  return (
    <div className="bg-secondary/20">
      <div className="border-b border-border bg-background">
        <div className="container py-10">
          <nav
            aria-label="Навигационная цепочка"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Link href="/" className="hover:text-primary">
              Главная
            </Link>
            <ChevronRight className="size-4" />
            <span className="text-primary">Электромонтажные работы</span>
          </nav>
          <h1 className="mt-6 max-w-3xl font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Электромонтажные работы под ключ
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-steel-700">
            Берём в работу электромонтажные проекты любого уровня сложности. Поможем обсудить
            задачу, состав работ и необходимые материалы.
          </p>
        </div>
      </div>

      <div className="container grid gap-10 py-12 lg:grid-cols-[1fr_0.9fr]">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold text-primary">Как начать работу</h2>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-steel-700">
            <li>Расскажите об объекте, месте проведения работ и требуемом результате.</li>
            <li>
              При наличии приложите техническое задание или проектную документацию при дальнейшей
              переписке.
            </li>
            <li>После изучения задачи согласуем объём, условия и стоимость работ.</li>
          </ol>
          <p className="mt-8 text-sm text-muted-foreground">
            Географию выполнения, сроки и состав бригады уточняем для каждого проекта отдельно.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-primary">
            Обсудить электромонтаж
          </h2>
          <p className="mb-6 mt-2 text-sm text-muted-foreground">
            Оставьте контакты и кратко опишите объект. Ответим в рабочее время.
          </p>
          <QuoteForm
            defaultTitle="Электромонтажные работы под ключ"
            messagePlaceholder="Тип объекта, город, примерный объём работ и что требуется выполнить"
          />
        </div>
      </div>
    </div>
  );
}
