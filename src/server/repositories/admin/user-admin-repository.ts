import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const userAdminRepository = {
  list() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { quotes: true } } },
    });
  },
  byId(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },
  /** Narrow lookup for self-service flows (company team invite) — never the full row, no passwordHash. */
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });
  },
  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },
  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};
