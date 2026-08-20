export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { siteConfig } from "@/config/site";
import { availabilityLabels } from "@/config/catalog-sort";
import { productService } from "@/server/services";
import { buildProductJsonLd, averageRating } from "@/lib/product-jsonld";
import { formatTenge } from "@/lib/money";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { SectionNav } from "@/components/product/section-nav";
import { SpecTable } from "@/components/product/spec-table";
import { DocumentList } from "@/components/product/document-list";
import { Reviews } from "@/components/product/reviews";
import { RelatedProducts } from "@/components/product/related-products";
import { AnalogsCallout } from "@/components/product/analogs-callout";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Pre-render every product page at build time (SSG). */
// Pages render on-demand from the DB (force-dynamic). To pre-render at
// build time instead, return slugs here and switch off force-dynamic.
export async function generateStaticParams() {
  return [] as { slug: string }[];
}

/** Per-product SEO metadata. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await productService.getBySlug(slug);
  if (!product) return { title: "Товар не найден" };

  const priceText = product.price !== null ? `от ${formatTenge(product.price)}` : "цена по запросу";
  const title = `${product.title} — купить в Казахстане`;
  const description = `${product.title}, ${product.manufacturer}. ${priceText}, ${availabilityLabels[
    product.availability
  ].toLowerCase()}. Артикул ${product.sku}. Сертификаты, документы, доставка по РК. Получить КП за 15 минут.`;
  const url = `${siteConfig.url}/catalog/${product.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: siteConfig.name,
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await productService.getBySlug(slug);
  if (!product) notFound();

  const related = await productService.getRelated(product);
  const analogs =
    product.availability === "in_stock" ? [] : await productService.getAnalogsInStock(product);
  const avgRating = averageRating(product.reviews);

  const sections = [
    { id: "description", label: "Описание" },
    { id: "specs", label: "Характеристики" },
    { id: "documents", label: "Документы" },
    { id: "reviews", label: "Отзывы" },
    { id: "related", label: "Похожие" },
  ];

  const { productLd, breadcrumbLd } = buildProductJsonLd(product, avgRating);
  return (
    <div className="bg-secondary/20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="container py-6">
        {/* Breadcrumb */}
        <nav
          aria-label="Навигационная цепочка"
          className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Link href="/" className="hover:text-primary">
            Главная
          </Link>
          <ChevronRight className="size-4" />
          <Link href="/catalog" className="hover:text-primary">
            Каталог
          </Link>
          <ChevronRight className="size-4" />
          <Link href={`/catalog?cat=${product.categorySlug}`} className="hover:text-primary">
            {product.category}
          </Link>
          <ChevronRight className="size-4" />
          <span className="font-medium text-primary">{product.title}</span>
        </nav>

        {/* Top: gallery + purchase panel */}
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <ProductGallery
              categorySlug={product.categorySlug}
              images={product.images}
              count={product.galleryCount}
              badge={product.badge}
              title={product.title}
            />
          </div>

          <div className="lg:row-span-2">
            <div className="lg:sticky lg:top-24">
              <div className="mb-4">
                <span className="text-sm font-medium text-signal-700">{product.manufacturer}</span>
                <h1 className="mt-1 font-display text-2xl font-bold leading-tight tracking-tight text-primary sm:text-3xl">
                  {product.title}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Категория:{" "}
                  <Link
                    href={`/catalog?cat=${product.categorySlug}`}
                    className="text-steel-700 underline-offset-2 hover:text-signal-700 hover:underline"
                  >
                    {product.category}
                  </Link>
                </p>
              </div>
              <PurchasePanel product={product} />
              <AnalogsCallout products={analogs} />
            </div>
          </div>
        </div>

        {/* Sticky section nav */}
        <div className="mt-10">
          <SectionNav sections={sections} />
        </div>

        {/* Content column (constrained to left track) */}
        <div className="mt-8 max-w-3xl space-y-14 pb-10 lg:pr-8">
          <section id="description" className="scroll-mt-32">
            <h2 className="font-display text-xl font-bold text-primary">Описание</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-steel-700">
              {product.description.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          <section id="specs" className="scroll-mt-32">
            <h2 className="font-display text-xl font-bold text-primary">
              Технические характеристики
            </h2>
            <div className="mt-4">
              <SpecTable groups={product.specGroups} />
            </div>
          </section>

          <section id="documents" className="scroll-mt-32">
            <h2 className="font-display text-xl font-bold text-primary">Документы и сертификаты</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Паспорта, сертификаты соответствия и инструкции в формате PDF.
            </p>
            <div className="mt-4">
              <DocumentList documents={product.documents} />
            </div>
          </section>

          <section id="reviews" className="scroll-mt-32">
            <h2 className="font-display text-xl font-bold text-primary">Отзывы</h2>
            <div className="mt-4">
              <Reviews reviews={product.reviews} />
            </div>
          </section>
        </div>

        {/* Related — full width */}
        <section id="related" className="scroll-mt-32 border-t border-border pt-12">
          <h2 className="font-display text-2xl font-bold tracking-tight text-primary">
            Похожие товары
          </h2>
          <p className="mt-2 text-muted-foreground">
            Из категории «{product.category}» с близкими параметрами.
          </p>
          <div className="mt-8">
            <RelatedProducts products={related} />
          </div>
        </section>
      </div>
    </div>
  );
}
