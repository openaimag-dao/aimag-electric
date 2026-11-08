import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { siteConfig } from "@/config/site";
import { dataCenterCategories, findDataCenterCategory } from "@/config/data-center";
import { buildFaqJsonLd } from "@/lib/faq-jsonld";
import { ContentBlocks } from "@/components/common/content-blocks";
import { DataCenterRequestDialog } from "@/components/data-center/request-dialog";
import { SeoBreadcrumbs } from "@/components/common/seo-breadcrumbs";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return dataCenterCategories.map(({ slug }) => ({ slug }));
}

function findCategory(slug: string) {
  const category = findDataCenterCategory(slug);
  if (!category) notFound();
  return category;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = findCategory((await params).slug);
  const path = `/data-center/${category.slug}`;
  return {
    title: category.metaTitle,
    description: category.metaDescription,
    alternates: { canonical: path },
    openGraph: {
      title: category.metaTitle,
      description: category.metaDescription,
      type: "website",
      url: `${siteConfig.url}${path}`,
    },
  };
}

export default async function DataCenterCategoryPage({ params }: PageProps) {
  const category = findCategory((await params).slug);

  return (
    <div className="container py-10">
      {category.faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildFaqJsonLd(category.faq)).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <SeoBreadcrumbs
        items={[
          { name: "Главная", href: "/" },
          { name: "Оборудование для дата-центров", href: "/data-center" },
          { name: category.title, href: `/data-center/${category.slug}` },
        ]}
      />
      <h1 className="mt-4 font-display text-3xl font-bold text-primary">{category.h1}</h1>
      <p className="mt-4 max-w-3xl text-steel-700">{category.intro}</p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-primary">Состав категории</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {category.subcategories.map((sub) => (
            <li
              key={sub.label}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
            >
              <span className="text-primary">{sub.label}</span>
              {sub.relatedCategorySlug ? (
                <Link
                  href={`/catalog?cat=${sub.relatedCategorySlug}`}
                  className="shrink-0 whitespace-nowrap text-xs text-signal-700 underline-offset-2 hover:underline"
                >
                  В каталоге →
                </Link>
              ) : (
                <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                  По запросу
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 max-w-3xl">
        <ContentBlocks blocks={category.content} />
      </section>

      {category.faq.length > 0 && (
        <section className="mt-8 max-w-3xl">
          <h2 className="text-xl font-semibold text-primary">Вопросы о поставке</h2>
          {category.faq.map(({ q, a }) => (
            <div key={q} className="mt-4">
              <h3 className="font-semibold">{q}</h3>
              <p className="mt-1 text-steel-700">{a}</p>
            </div>
          ))}
        </section>
      )}

      <section className="mt-8 rounded-xl border border-border p-5">
        <h2 className="text-xl font-semibold text-primary">Запросить коммерческое предложение</h2>
        <p className="mt-2 text-steel-700">
          Укажите позиции, количество и город доставки — цена и срок поставки подтверждаются по
          заявке.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <DataCenterRequestDialog
            triggerLabel={`Запросить КП: ${category.title}`}
            defaultCategory={category.title}
          />
          <Link href="/data-center" className="self-center text-sm underline underline-offset-2">
            Все категории ЦОД
          </Link>
        </div>
      </section>
    </div>
  );
}
