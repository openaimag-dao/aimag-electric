import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { withCaseStudyTable } from "@/server/repositories/content-self-heal";

export const caseStudyAdminRepository = {
  list() {
    return withCaseStudyTable(() => prisma.caseStudy.findMany({ orderBy: { order: "asc" } }));
  },
  byId(id: string) {
    return withCaseStudyTable(() => prisma.caseStudy.findUnique({ where: { id } }));
  },
  create(data: Prisma.CaseStudyCreateInput) {
    return withCaseStudyTable(() => prisma.caseStudy.create({ data }));
  },
  update(id: string, data: Prisma.CaseStudyUpdateInput) {
    return withCaseStudyTable(() => prisma.caseStudy.update({ where: { id }, data }));
  },
  remove(id: string) {
    return withCaseStudyTable(() => prisma.caseStudy.delete({ where: { id } }));
  },
};
