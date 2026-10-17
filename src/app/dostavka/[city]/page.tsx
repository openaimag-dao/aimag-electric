import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { siteConfig } from "@/config/site";
import { DELIVERY_CITIES } from "@/config/delivery-cities";
import { SeoBreadcrumbs } from "@/components/common/seo-breadcrumbs";
import { QuoteDialog } from "@/components/common/quote-dialog";

interface PageProps {
  params: Promise<{ city: string }>;
}

export function generateStaticParams() {
  return DELIVERY_CITIES.map(({ slug }) => ({ city: slug }));
}

function findCity(slug: string) {
  const city = DELIVERY_CITIES.find((c) => c.slug === slug);
  if (!city) notFound();
  return city;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = findCity((await params).city);
  const title = `Доставка кабеля и электротехники в ${city.name}`;
  const description = `Доставляем кабель, провод, изоляторы и электротехническую продукцию в ${city.nameIn} транспортными компаниями со склада в Шымкенте. Цена, сроки и документы — по заявке.`;
  const path = `/dostavka/${city.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: `${siteConfig.url}${path}`, type: "website" },
  };
}

export default async function DeliveryCityPage({ params }: PageProps) {
  const city = findCity((await params).city);

  return (
    <div className="container py-10">
      <SeoBreadcrumbs
        items={[
          { name: "Главная", href: "/" },
          { name: "Доставка", href: "/dostavka" },
          { name: city.name, href: `/dostavka/${city.slug}` },
        ]}
      />

      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
        Доставка в {city.nameIn}
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {city.region}. Отгружаем кабель, провод, изоляторы, кабельную арматуру и другую
        электротехническую продукцию со склада в Шымкенте.
      </p>

      <div className="mt-8 max-w-3xl space-y-8">
        <section>
          <h2 className="font-display text-xl font-semibold text-primary">
            Доставка транспортными компаниями
          </h2>
          <p className="mt-2 leading-relaxed text-foreground">
            Отправляем заказы в {city.nameIn} ведущими транспортными компаниями, действующими на
            территории Казахстана. Если у вас есть предпочтительный перевозчик или договор с ТК —
            отгрузим через него.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-foreground">
            <li>
              Стоимость доставки рассчитывается по тарифам транспортной компании и зависит от веса,
              объёма и направления — точную стоимость менеджер сообщает при подтверждении заказа.
            </li>
            <li>
              Кабельная продукция отгружается на барабанах или в бухтах с соблюдением норм
              транспортировки.
            </li>
            <li>
              Вместе с грузом передаётся полный комплект документов: накладная, счёт-фактура,
              паспорта и сертификаты на продукцию (по запросу).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-primary">Сроки</h2>
          <p className="mt-2 leading-relaxed text-foreground">
            Товары в наличии передаются в транспортную компанию, как правило, в течение 1–2 рабочих
            дней после подтверждения оплаты. Срок доставки в {city.nameIn} зависит от перевозчика —
            обычно от 2 до 7 рабочих дней. Позиции под заказ согласовываются отдельно.
          </p>
        </section>

        <section className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display font-semibold text-primary">
              Уточнить цену и срок доставки в {city.nameIn}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Пришлите список позиций — менеджер рассчитает стоимость с доставкой.
            </p>
          </div>
          <QuoteDialog triggerLabel="Запросить КП" />
        </section>
      </div>
    </div>
  );
}
