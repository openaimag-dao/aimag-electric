import "server-only";

import { prisma } from "@/lib/prisma";

export const attributeRepository = {
  /** Every filterable attribute, in display order — drives the catalog's dynamic facet sections. */
  findFilterable() {
    return prisma.attribute.findMany({
      where: { filterable: true },
      orderBy: { order: "asc" },
    });
  },
};
