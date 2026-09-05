import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { withPostTable } from "@/server/repositories/content-self-heal";

export const postAdminRepository = {
  list() {
    return withPostTable(() => prisma.post.findMany({ orderBy: { publishedAt: "desc" } }));
  },
  byId(id: string) {
    return withPostTable(() => prisma.post.findUnique({ where: { id } }));
  },
  create(data: Prisma.PostCreateInput) {
    return withPostTable(() => prisma.post.create({ data }));
  },
  update(id: string, data: Prisma.PostUpdateInput) {
    return withPostTable(() => prisma.post.update({ where: { id }, data }));
  },
  remove(id: string) {
    return withPostTable(() => prisma.post.delete({ where: { id } }));
  },
};
