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
};
