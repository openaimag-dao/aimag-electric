import "server-only";

import { prisma } from "@/lib/prisma";
import { withCaseStudyTable } from "@/server/repositories/content-self-heal";

const listSelect = {
  slug: true,
  title: true,
  scope: true,
  location: true,
  year: true,
  metric: true,
  metricLabel: true,
  category: true,
} as const;

export const caseStudyRepository = {
  /** Manually ordered — for /projects and the homepage teaser. */
  findPublished(take?: number) {
    return withCaseStudyTable(() =>
      prisma.caseStudy.findMany({
        where: { published: true },
        select: listSelect,
        orderBy: { order: "asc" },
        take,
      })
    );
  },

  findBySlug(slug: string) {
    return withCaseStudyTable(() =>
      prisma.caseStudy.findFirst({ where: { slug, published: true } })
    );
  },

  allSlugs() {
    return withCaseStudyTable(() =>
      prisma.caseStudy.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      })
    );
  },
};
