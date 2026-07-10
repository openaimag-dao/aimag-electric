import "server-only";

import type { Prisma, CustomerStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const listInclude = {
  owner: { select: { id: true, name: true, email: true } },
  _count: { select: { deals: true, quotes: true, activities: true } },
} satisfies Prisma.CustomerInclude;

export const customerAdminRepository = {
  list(status?: CustomerStatus) {
    return prisma.customer.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: "desc" },
      include: listInclude,
    });
  },
  byId(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        deals: { orderBy: { createdAt: "desc" } },
        quotes: { orderBy: { createdAt: "desc" } },
        activities: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { name: true, email: true } } },
        },
      },
    });
  },
  create(data: Prisma.CustomerCreateInput) {
    return prisma.customer.create({ data });
  },
  update(id: string, data: Prisma.CustomerUpdateInput) {
    return prisma.customer.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.customer.delete({ where: { id } });
  },
  count() {
    return prisma.customer.count();
  },
};

export type CustomerAdminRow = Prisma.CustomerGetPayload<{ include: typeof listInclude }>;
