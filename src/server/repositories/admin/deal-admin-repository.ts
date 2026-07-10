import "server-only";

import type { Prisma, DealStage } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const listInclude = {
  customer: { select: { id: true, company: true } },
  owner: { select: { id: true, name: true } },
} satisfies Prisma.DealInclude;

export const dealAdminRepository = {
  list(stage?: DealStage) {
    return prisma.deal.findMany({
      where: stage ? { stage } : undefined,
      orderBy: { createdAt: "desc" },
      include: listInclude,
    });
  },
  board() {
    return prisma.deal.findMany({
      orderBy: { createdAt: "desc" },
      include: listInclude,
    });
  },
  byId(id: string) {
    return prisma.deal.findUnique({
      where: { id },
      include: {
        customer: true,
        owner: { select: { id: true, name: true, email: true } },
        quote: true,
        activities: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      },
    });
  },
  create(data: Prisma.DealCreateInput) {
    return prisma.deal.create({ data });
  },
  update(id: string, data: Prisma.DealUpdateInput) {
    return prisma.deal.update({ where: { id }, data });
  },
  setStage(id: string, stage: DealStage) {
    return prisma.deal.update({ where: { id }, data: { stage } });
  },
  remove(id: string) {
    return prisma.deal.delete({ where: { id } });
  },
  groupByStage() {
    return prisma.deal.groupBy({ by: ["stage"], _count: true, _sum: { amount: true } });
  },
};

export type DealAdminRow = Prisma.DealGetPayload<{ include: typeof listInclude }>;
