import Link from "next/link";
import { ArrowRight, Cable, ListChecks, UtilityPole } from "lucide-react";

const routes = [
  {
    title: "Кабель ВВГ и АВВГ",
    description: "Сравните марки и характеристики, выберите позиции для расчёта поставки.",
    href: "/kabeli-vvg-avvg",
    action: "Выбрать кабель",
    icon: Cable,
  },
  {
    title: "Провод СИП",
    description: "Марки провода для воздушных линий и информация по подбору арматуры.",
    href: "/kabeli-sip",
    action: "Выбрать СИП",
    icon: UtilityPole,
  },
  {
    title: "Есть список артикулов?",
    description: "Вставьте артикулы AIMAG и количество — соберите несколько позиций в корзину.",
    href: "/quick-order",
    action: "Заказать списком",
    icon: ListChecks,
  },
];

export function BuyingGuide() {
  return (
    <section
      aria-labelledby="buying-guide-title"
      className="border-b border-border bg-secondary/30 py-10 md:py-12"
    >
      <div className="container">
        <h2
          id="buying-guide-title"
          className="font-display text-2xl font-bold tracking-tight text-primary"
        >
          Что нужно для вашего объекта?
        </h2>
        <p className="mt-2 text-muted-foreground">
          Выберите направление или перейдите к заказу по готовому списку.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {routes.map(({ title, description, href, action, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-colors hover:border-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="size-6 text-signal-700" aria-hidden />
              <h3 className="mt-4 font-display text-lg font-semibold text-primary">{title}</h3>
              <p className="mb-5 mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:underline">
                {action}
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
