import "server-only";

import { prisma } from "@/lib/prisma";

export const categoryRepository = {
  findMany() {
    return prisma.category.findMany({ orderBy: { order: "asc" } });
  },
  findBySlug(slug: string) {
    return prisma.category.findUnique({ where: { slug } });
  },
};
