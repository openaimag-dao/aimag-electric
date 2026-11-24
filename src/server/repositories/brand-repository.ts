import "server-only";

import { prisma } from "@/lib/prisma";

export const brandRepository = {
  // "bez-brenda" is a placeholder brand used internally for products with no
  // real manufacturer on record (most of the Alageum import) — it isn't a
  // real brand, so it's excluded from the home page's manufacturer showcase.
  findMany() {
    return prisma.brand.findMany({
      where: { slug: { not: "bez-brenda" } },
      orderBy: { name: "asc" },
    });
  },
};
