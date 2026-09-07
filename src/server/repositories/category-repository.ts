import "server-only";

import { prisma } from "@/lib/prisma";
import { columnSelfHeal } from "@/lib/db-self-heal";

const withImageColumn = columnSelfHeal(
  `ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "image" TEXT`
);

export const categoryRepository = {
  findMany() {
    return withImageColumn(() => prisma.category.findMany({ orderBy: { order: "asc" } }));
  },
  findBySlug(slug: string) {
    return withImageColumn(() => prisma.category.findUnique({ where: { slug } }));
  },

  /**
   * Categories with a real product count and a representative photo — used
   * by the homepage category grid. Prefers the admin-set Category.image;
   * falls back to the most popular in-stock product's own photo in that
   * category, so every tile gets a real photo without anyone having to
   * curate one by hand. 22 categories, so this is 22 cheap indexed lookups
   * per cache fill (1h, see home-service.ts) rather than one clever query.
   */
  async findManyWithStats() {
    const categories = await withImageColumn(() =>
      prisma.category.findMany({ orderBy: { order: "asc" } })
    );
    return Promise.all(
      categories.map(async (category) => {
        const [productCount, topProduct] = await Promise.all([
          prisma.product.count({ where: { categoryId: category.id, published: true } }),
          // images.url is nullable (placeholder rows exist for products with
          // no photo yet) — both the existence check and the picked image
          // itself must require a real url, or a popular-but-photo-less
          // product can silently win the tiebreak and the tile falls back
          // to the icon.
          category.image
            ? null
            : prisma.product.findFirst({
                where: {
                  categoryId: category.id,
                  published: true,
                  images: { some: { url: { not: null } } },
                },
                orderBy: { popularity: "desc" },
                select: {
                  images: {
                    where: { url: { not: null } },
                    orderBy: { order: "asc" },
                    take: 1,
                    select: { url: true },
                  },
                },
              }),
        ]);
        return {
          ...category,
          productCount,
          image: category.image ?? topProduct?.images[0]?.url ?? null,
        };
      })
    );
  },
};
