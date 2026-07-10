import "server-only";

import { prisma } from "@/lib/prisma";

export const brandRepository = {
  findMany() {
    return prisma.brand.findMany({ orderBy: { name: "asc" } });
  },
};
