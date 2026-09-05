import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";

import { postRepository, caseStudyRepository } from "@/server/repositories";
import type { PostDTO, PostDetailDTO, CaseStudyDTO, CaseStudyDetailDTO } from "@/server/dto";
import { CACHE_TAGS } from "@/lib/cache-tags";

interface PostRow {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: string;
  publishedAt: Date;
}

function toPostDTO(p: PostRow): PostDTO {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    readingTime: p.readingTime,
    publishedAt: p.publishedAt.toISOString().slice(0, 10),
  };
}

interface CaseStudyRow {
  slug: string;
  title: string;
  scope: string;
  location: string;
  year: string;
  metric: string;
  metricLabel: string;
  category: string;
}

function toCaseStudyDTO(p: CaseStudyRow): CaseStudyDTO {
  return {
    slug: p.slug,
    title: p.title,
    scope: p.scope,
    location: p.location,
    year: p.year,
    metric: p.metric,
    metricLabel: p.metricLabel,
    category: p.category,
  };
}

const loadPosts = unstable_cache(
  async (take?: number): Promise<PostDTO[]> =>
    (await postRepository.findPublished(take)).map(toPostDTO),
  ["posts-list"],
  { tags: [CACHE_TAGS.posts], revalidate: 600 }
);

const loadCaseStudies = unstable_cache(
  async (take?: number): Promise<CaseStudyDTO[]> =>
    (await caseStudyRepository.findPublished(take)).map(toCaseStudyDTO),
  ["case-studies-list"],
  { tags: [CACHE_TAGS.caseStudies], revalidate: 600 }
);

export const postService = {
  list: cache((take?: number) => loadPosts(take)),
  getBySlug: cache(async (slug: string): Promise<PostDetailDTO | null> => {
    const row = await postRepository.findBySlug(slug);
    return row ? { ...toPostDTO(row), content: row.content } : null;
  }),
  allSlugs: cache(async (): Promise<{ slug: string; updatedAt: Date }[]> =>
    postRepository.allSlugs()
  ),
};

export const caseStudyService = {
  list: cache((take?: number) => loadCaseStudies(take)),
  getBySlug: cache(async (slug: string): Promise<CaseStudyDetailDTO | null> => {
    const row = await caseStudyRepository.findBySlug(slug);
    return row ? { ...toCaseStudyDTO(row), description: row.description } : null;
  }),
  allSlugs: cache(async (): Promise<{ slug: string; updatedAt: Date }[]> =>
    caseStudyRepository.allSlugs()
  ),
};
