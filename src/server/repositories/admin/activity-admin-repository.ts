import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const activityAdminRepository = {
  create(data: Prisma.ActivityCreateInput) {
    return prisma.activity.create({ data });
  },
  remove(id: string) {
    return prisma.activity.delete({ where: { id } });
  },
  toggleDone(id: string, done: boolean) {
    return prisma.activity.update({ where: { id }, data: { done } });
  },
  upcomingTasks(take = 10) {
    return prisma.activity.findMany({
      where: { type: "TASK", done: false, dueAt: { not: null } },
      orderBy: { dueAt: "asc" },
      take,
      include: {
        customer: { select: { id: true, company: true } },
        deal: { select: { id: true, title: true } },
      },
    });
  },
};
