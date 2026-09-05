import "server-only";

import { prisma } from "@/lib/prisma";
import { withPostTable } from "@/server/repositories/content-self-heal";

const listSelect = {
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  readingTime: true,
  publishedAt: true,
} as const;

export const postRepository = {
  /** Newest first — for /blog and the homepage teaser. */
  findPublished(take?: number) {
    return withPostTable(() =>
      prisma.post.findMany({
        where: { published: true },
        select: listSelect,
        orderBy: { publishedAt: "desc" },
        take,
      })
    );
  },

  findBySlug(slug: string) {
    return withPostTable(() => prisma.post.findFirst({ where: { slug, published: true } }));
  },

  allSlugs() {
    return withPostTable(() =>
      prisma.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } })
    );
  },
};
