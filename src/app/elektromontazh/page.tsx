import type { Metadata } from "next";
import Link from "next/link";

import { QuoteForm } from "@/components/common/quote-form";
import { SeoBreadcrumbs } from "@/components/common/seo-breadcrumbs";
import { siteConfig } from "@/config/site";
import { buildFaqJsonLd } from "@/lib/faq-jsonld";

const path = "/elektromontazh";

export const metadata: Metadata = {
  title: "Электромонтажные работы под ключ в Шымкенте и по Казахстану",
  description:
    "AIMAG ELECTRIC принимает заявки на электромонтажные работы под ключ в Шымкенте и по всему Казахстану: силовые линии, щиты, освещение, заземление. Обсудим состав работ, сроки и стоимость.",
  alternates: { canonical: path },
  openGraph: {
    title: "Электромонтажные работы под ключ в Шымкенте и по Казахстану",
    description:
      "Силовая разводка, щиты, освещение, заземление и молниезащита, пусконаладка — заявки на электромонтаж под ключ для объектов любой сложности.",
    type: "website",
    url: `${siteConfig.url}${path}`,
  },
};

const workTypes = [
  {
    title: "Силовая разводка и кабельные линии",
    text: "Прокладка силового и контрольного кабеля, монтаж кабельных лотков, лестниц и труб, подключение электроприёмников.",
  },
  {
    title: "Щиты и распределительные устройства",
    text: "Сборка и монтаж ГРЩ, ВРУ, щитов освещения и учёта, подключение автоматических выключателей и защитной аппаратуры.",
  },
  {
    title: "Освещение",
    text: "Монтаж рабочего, аварийного и уличного освещения — от разводки до установки светильников.",
  },
  {
    title: "Заземление и молниезащита",
    text: "Устройство контура заземления, уравнивание потенциалов, молниезащита зданий и сооружений.",
  },
  {
    title: "Пусконаладочные работы",
    text: "Проверка и наладка смонтированного электрооборудования перед передачей объекта в эксплуатацию.",
  },
];

const faq = [
  {
    q: "Как рассчитывается стоимость электромонтажных работ?",
    a: "Стоимость зависит от объёма, сложности объекта и региона — фиксированных расценок за м² или точку мы не публикуем. Опишите объект в заявке, и мы посчитаем смету после изучения задачи.",
  },
  {
    q: "Можно заказать материалы и монтаж в одной заявке?",
    a: "Да, это обычная практика: укажите в заявке марки кабеля, щитового оборудования и объём работ — рассчитаем поставку материалов и монтаж вместе.",
  },
  {
    q: "В каких городах выполняются работы?",
    a: "Основной регион — Шымкент, но заявки принимаются по всему Казахстану; географию, сроки и состав бригады уточняем для каждого проекта отдельно.",
  },
  {
    q: "Нужна ли проектная документация для заявки?",
    a: "Нет, для первичной заявки достаточно описания объекта. Проект или техническое задание, если они есть, помогают точнее посчитать объём и стоимость — приложите их при дальнейшей переписке.",
  },
];

export default function ElectricalInstallationPage() {
  return (
    <div className="bg-secondary/20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            serviceType: "Электромонтажные работы",
            provider: { "@type": "Organization", name: "AIMAG ELECTRIC", url: siteConfig.url },
            areaServed: { "@type": "Country", name: "Казахстан" },
            url: `${siteConfig.url}${path}`,
          }).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqJsonLd(faq)).replace(/</g, "\\u003c"),
        }}
      />
      <div className="border-b border-border bg-background">
        <div className="container py-10">
          <SeoBreadcrumbs
            items={[
              { name: "Главная", href: "/" },
              { name: "Электромонтажные работы", href: path },
            ]}
          />
          <h1 className="mt-6 max-w-3xl font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Электромонтажные работы под ключ в Шымкенте и по Казахстану
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
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold text-primary">
              Материалы и работы в одной заявке
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-steel-700">
              Кабели, СИП, изоляторы, трансформатор и КТП удобно обсудить вместе с монтажом.
              Подготовили список исходных данных, чтобы уточнить комплектацию и объём работ.
            </p>
            <Link
              href="/blog/komplektaciya-obekta-elektromontazh-pod-klyuch"
              className="mt-3 inline-block text-sm font-semibold text-signal-700 underline-offset-2 hover:underline"
            >
              Как подготовить заявку на объект →
            </Link>
          </div>
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

      <div className="container pb-12">
        <h2 className="font-display text-2xl font-semibold text-primary">
          Виды электромонтажных работ
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workTypes.map((w) => (
            <div key={w.title} className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-primary">{w.title}</h3>
              <p className="mt-2 text-sm text-steel-700">{w.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="container pb-12">
        <h2 className="font-display text-2xl font-semibold text-primary">
          Материалы для электромонтажа
        </h2>
        <p className="mt-2 max-w-2xl text-steel-700">
          Кабель, щитовое оборудование, автоматические выключатели, светильники и кабельную арматуру
          можно подобрать в каталоге и запросить вместе с монтажом.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm underline">
          <Link href="/catalog?cat=kabel-provod">Кабель и провод</Link>
          <Link href="/catalog?cat=shchity-korpusa">Щиты и корпуса</Link>
          <Link href="/catalog?cat=avtomaty">Автоматические выключатели</Link>
          <Link href="/catalog?cat=osveshchenie">Освещение</Link>
          <Link href="/promyshlennye-kabeli">Промышленные кабели по маркам</Link>
          <Link href="/data-center">Оборудование для дата-центров</Link>
        </div>
      </div>

      <div className="container pb-16">
        <h2 className="font-display text-2xl font-semibold text-primary">
          Вопросы об электромонтаже
        </h2>
        {faq.map(({ q, a }) => (
          <div key={q} className="mt-4 max-w-3xl">
            <h3 className="font-semibold text-primary">{q}</h3>
            <p className="mt-1 text-steel-700">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
