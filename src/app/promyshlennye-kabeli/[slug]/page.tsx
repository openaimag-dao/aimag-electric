import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { industrialCablePages } from "@/config/industrial-cable-pages";
import { industrialCables, industrialCableRequest } from "@/config/industrial-cables";
import { siteConfig } from "@/config/site";
import { buildFaqJsonLd } from "@/lib/faq-jsonld";

interface PageProps {
  params: Promise<{ slug: string }>;
}
export function generateStaticParams() {
  return industrialCablePages.map(({ slug }) => ({ slug }));
}
function findPage(slug: string) {
  const content = industrialCablePages.find((item) => item.slug === slug);
  if (!content) notFound();
  const group = industrialCables.find((item) => item.id === content.groupId);
  if (!group) notFound();
  return { content, group };
}
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { content } = findPage((await params).slug);
  const path = `/promyshlennye-kabeli/${content.slug}`;
  return {
    title: content.title,
    description: content.description,
    alternates: { canonical: path },
    openGraph: {
      title: content.title,
      description: content.description,
      type: "website",
      url: `${siteConfig.url}${path}`,
    },
  };
}
export default async function CablePage({ params }: PageProps) {
  const { content, group } = findPage((await params).slug);
  return (
    <div className="container py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFaqJsonLd(content.faq)).replace(/</g, "\\u003c"),
        }}
      />
      <Link href="/promyshlennye-kabeli" className="text-sm underline">
        Все промышленные кабели
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold text-primary">
        Купить кабель {content.name} в Казахстане
      </h1>
      <p className="mt-4 max-w-3xl text-steel-700">{content.intro}</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Цена, наличие, изготовитель и срок поставки подтверждаются по заявке. Размеры ниже —
        варианты для запроса, а не складские остатки.
      </p>
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-primary">Размеры {content.name} для расчёта</h2>
        <p className="mt-2 text-sm">
          {group.execution}. Обозначение размера: число жил × сечение в мм².
        </p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {group.sizes.map((size) => (
            <li key={size} className="rounded-xl border border-border p-4">
              <h3 className="font-semibold">
                {content.name} {size}
              </h3>
              <QuoteDialog
                triggerLabel={`Запросить цену ${content.name} ${size}`}
                variant="outline"
                className="mt-3 h-auto w-full whitespace-normal"
                defaultMessage={industrialCableRequest(group.mark, size, group.execution)}
              />
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8 max-w-3xl">
        <h2 className="text-xl font-semibold text-primary">
          Что указать при заказе {content.name}
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-steel-700">
          {content.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4 text-steel-700">{content.advice}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Область применения:{" "}
          <a href={content.source} className="underline">
            документация изготовителя
          </a>
          . Ссылка служит техническим справочником; изготовитель поставляемого кабеля согласуется в
          предложении.
        </p>
      </section>
      <section className="mt-8 max-w-3xl">
        <h2 className="text-xl font-semibold text-primary">Вопросы о поставке</h2>
        {content.faq.map(({ q, a }) => (
          <div key={q} className="mt-4">
            <h3 className="font-semibold">{q}</h3>
            <p className="mt-1 text-steel-700">{a}</p>
          </div>
        ))}
      </section>
      <section className="mt-8 rounded-xl border border-border p-5">
        <h2 className="text-xl font-semibold text-primary">Расчёт по спецификации</h2>
        <p className="mt-2">
          Укажите метраж, город доставки, желаемый срок и необходимые документы. Другие размеры и
          комплектация также рассчитываются по запросу.
        </p>
        <QuoteDialog
          triggerLabel="Рассчитать по спецификации"
          className="mt-4"
          defaultMessage={`Прошу рассчитать кабель ${content.name} по спецификации.\nМарки и размеры: \nМетраж по каждой позиции: \nГород доставки: \nЖелаемый срок: \nТребования к документам и монтажу: `}
        />
        <div className="mt-4 flex flex-wrap gap-4 text-sm underline">
          <Link href="/blog/kupit-kabelnye-mufty-kazakhstan">Кабельные муфты</Link>
          <Link href="/elektromontazh">Электромонтаж под ключ</Link>
          {industrialCablePages
            .filter((item) => item.slug !== content.slug)
            .map((item) => (
              <Link key={item.slug} href={`/promyshlennye-kabeli/${item.slug}`}>
                Кабель {item.name}
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
