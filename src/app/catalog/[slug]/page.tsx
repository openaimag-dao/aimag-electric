export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { siteConfig } from "@/config/site";
import { availabilityLabels } from "@/config/catalog-sort";
import { slugRedirects } from "@/config/slug-redirects";
import { productService } from "@/server/services";
import { buildProductJsonLd, averageRating } from "@/lib/product-jsonld";
import { formatTenge, tiynToTenge } from "@/lib/money";
import { currentUser } from "@/server/auth/session";
import { companyAdminRepository, companyPriceAdminRepository } from "@/server/repositories/admin";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { SectionNav } from "@/components/product/section-nav";
import { SpecTable } from "@/components/product/spec-table";
import { DocumentList } from "@/components/product/document-list";
import { AskEngineer } from "@/components/product/ask-engineer";
import { RelatedProducts } from "@/components/product/related-products";
import { AnalogsCallout } from "@/components/product/analogs-callout";
import { RecordRecentlyViewed } from "@/components/recently-viewed/record-recently-viewed";
import { RecentlyViewedSection } from "@/components/recently-viewed/recently-viewed-section";

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
  if (!product) {
    const newSlug = slugRedirects[slug];
    if (newSlug) permanentRedirect(`/catalog/${newSlug}`);
    notFound();
  }

  const related = await productService.getRelated(product);
  const analogs =
    product.availability === "in_stock" ? [] : await productService.getAnalogsInStock(product);
  const avgRating = averageRating(product.reviews);

  // A logged-in company member's negotiated reference price, if staff has
  // set one — real data only, never guessed: resolved through the same
  // Quote.userId -> CompanyMember -> Company path used in /admin/quotes, so
  // an anonymous visitor or a user on no company simply sees no company
  // price, which is correct, not a bug. One bulk lookup covers the current
  // product plus every related product below, rather than N queries.
  const user = await currentUser();
  const membership = user ? await companyAdminRepository.forUser(user.id) : null;
  const companyPriceByProductId = new Map<string, number>();
  if (membership) {
    const companyPrices = await companyPriceAdminRepository.forCompaniesAndProducts(
      [membership.companyId],
      [product.id, ...related.map((r) => r.id)]
    );
    for (const cp of companyPrices) {
      companyPriceByProductId.set(cp.productId, tiynToTenge(cp.amountTiyn));
    }
  }
  const companyPriceTenge = companyPriceByProductId.get(product.id) ?? null;
  const relatedWithCompanyPrices = related.map((r) => ({
    ...r,
    companyPriceTenge: companyPriceByProductId.get(r.id) ?? null,
  }));

  const sections = [
    { id: "description", label: "Описание" },
    { id: "specs", label: "Характеристики" },
    ...(product.documents.length > 0 ? [{ id: "documents", label: "Документы" }] : []),
    { id: "ask-engineer", label: "Вопрос инженеру" },
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
      <RecordRecentlyViewed productId={product.id} />

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
              <PurchasePanel product={product} companyPriceTenge={companyPriceTenge} />
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

          {product.documents.length > 0 && (
            <section id="documents" className="scroll-mt-32">
              <h2 className="font-display text-xl font-bold text-primary">
                Документы и сертификаты
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Паспорта, сертификаты соответствия и инструкции в формате PDF.
              </p>
              <div className="mt-4">
                <DocumentList documents={product.documents} />
              </div>
            </section>
          )}

          <section id="ask-engineer" className="scroll-mt-32">
            <h2 className="font-display text-xl font-bold text-primary">Остались вопросы?</h2>
            <div className="mt-4">
              <AskEngineer product={product} />
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
            <RelatedProducts products={relatedWithCompanyPrices} />
          </div>
        </section>

        <div className="mt-12">
          <RecentlyViewedSection excludeProductId={product.id} />
        </div>
      </div>
    </div>
  );
}
