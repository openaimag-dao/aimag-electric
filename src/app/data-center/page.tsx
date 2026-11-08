import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, FileCheck2, FileSearch, Handshake, ListChecks, Workflow } from "lucide-react";

import { siteConfig } from "@/config/site";
import { dataCenterCategories } from "@/config/data-center";
import { DataCenterRequestDialog } from "@/components/data-center/request-dialog";
import { DataCenterRequestForm } from "@/components/data-center/request-form";
import { SeoBreadcrumbs } from "@/components/common/seo-breadcrumbs";

const path = "/data-center";

export const metadata: Metadata = {
  title: "Оборудование для дата-центров в Казахстане — комплексные поставки",
  description:
    "Электротехническое оборудование, кабельная продукция, системы распределения питания и инженерная инфраструктура для дата-центров. Поставки по Казахстану с приоритетом Шымкента, Алматы и Астаны.",
  alternates: { canonical: path },
  openGraph: {
    title: "Оборудование для дата-центров — комплексные поставки",
    description:
      "Электротехническое оборудование и инженерная инфраструктура для ЦОД: подбор, коммерческие предложения, сопровождение тендерных закупок.",
    type: "website",
    url: `${siteConfig.url}${path}`,
  },
};

const advantages = [
  { icon: Boxes, text: "Комплексные поставки по нескольким категориям в одной заявке" },
  { icon: Handshake, text: "Работа с юридическими лицами — по договору, с реквизитами и БИН" },
  { icon: FileCheck2, text: "Подготовка коммерческих предложений по спецификации или ТЗ" },
  { icon: FileSearch, text: "Подбор аналогов, если позиция из спецификации недоступна" },
  { icon: ListChecks, text: "Работа по техническому заданию и опросным листам" },
  { icon: Workflow, text: "Поставка оборудования под проект, с учётом сроков объекта" },
  { icon: Handshake, text: "Сопровождение тендерных закупок, включая квазигосударственный сектор" },
];

export default function DataCenterPage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            serviceType: "Поставка оборудования для дата-центров",
            provider: { "@type": "Organization", name: "AIMAG ELECTRIC", url: siteConfig.url },
            areaServed: { "@type": "Country", name: "Казахстан" },
            url: `${siteConfig.url}${path}`,
          }).replace(/</g, "\\u003c"),
        }}
      />

      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container">
          <div className="text-primary-foreground/70 [&_a:hover]:text-primary-foreground">
            <SeoBreadcrumbs
              items={[
                { name: "Главная", href: "/" },
                { name: "Оборудование для дата-центров", href: path },
              ]}
            />
          </div>
          <h1 className="mt-6 max-w-3xl font-display text-3xl font-bold sm:text-4xl">
            Комплексные поставки оборудования для дата-центров
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/80">
            Электротехническое оборудование, кабельная продукция, системы распределения питания и
            инженерная инфраструктура для ЦОД — для операторов дата-центров, EPC-подрядчиков,
            электромонтажных организаций, системных интеграторов, проектных организаций и отделов
            снабжения. Поставки по Казахстану с приоритетом Шымкента, Алматы и Астаны.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <DataCenterRequestDialog triggerLabel="Получить коммерческое предложение" />
            <DataCenterRequestDialog
              triggerLabel="Отправить спецификацию"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              defaultComment="Прикладываю спецификацию оборудования для расчёта."
            />
            <DataCenterRequestDialog
              triggerLabel="Запросить оптовые цены"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              defaultComment="Прошу оптовые цены по выбранным категориям."
            />
          </div>
        </div>
      </section>

      <section className="container py-12">
        <h2 className="font-display text-2xl font-bold text-primary">Категории оборудования</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dataCenterCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`${path}/${cat.slug}`}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-signal"
            >
              <h3 className="font-semibold text-primary group-hover:text-signal-700">
                {cat.title}
              </h3>
              <p className="mt-2 text-sm text-steel-700">{cat.summary}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {cat.subcategories.length} позиций в категории →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-secondary/40 py-12">
        <div className="container">
          <h2 className="font-display text-2xl font-bold text-primary">Преимущества AIMAG</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {advantages.map(({ icon: Icon, text }, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <Icon className="mt-0.5 size-5 shrink-0 text-signal-600" />
                <p className="text-sm text-steel-700">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-12">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold text-primary">
            Комплексное снабжение проектов ЦОД
          </h2>
          <p className="mt-3 max-w-3xl text-steel-700">
            Для крупного объекта заявку можно отправить сразу по нескольким категориям —
            электроснабжение, кабельная продукция, охлаждение, автоматика — одним письмом, с
            приложением спецификации или опросного листа. AIMAG запрашивает цены у поставщиков,
            подбирает аналоги при недоступности позиции и готовит сводное коммерческое предложение;
            при необходимости заявка сопровождается в рамках тендерной закупки.
          </p>
        </div>
      </section>

      <section className="container pb-16">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold text-primary">
            Запрос коммерческого предложения
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-steel-700">
            Заполните форму — можно выбрать несколько категорий сразу и приложить спецификацию.
          </p>
          <div className="mt-6 max-w-xl">
            <DataCenterRequestForm />
          </div>
        </div>
      </section>
    </div>
  );
}
