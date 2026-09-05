// force-dynamic: every underlying query (homeService.*) is already
// unstable_cache'd with its own revalidate window/tag, so this isn't about
// data freshness — it's so the page doesn't need DATABASE_URL at *build*
// time. Without it, `next build` tries to prerender "/" and fails outright
// on any environment that doesn't have DATABASE_URL set for the build step
// (e.g. this repo's Preview deployments today), rather than only failing at
// request time on that one environment.
export const dynamic = "force-dynamic";

import {
  Hero,
  Categories,
  PopularProducts,
  Manufacturers,
  Features,
  Process,
  Projects,
  Articles,
  Cta,
} from "@/components/sections";
import { homeService, postService, caseStudyService } from "@/server/services";

/**
 * AIMAG ELECTRIC — homepage. All catalog-driven sections (Hero links,
 * Categories, Popular products, Manufacturers, Projects, Articles) are
 * sourced from the database; Features/Process stay in config as static
 * editorial copy about how the company works, not content that gets added to.
 */
export default async function HomePage() {
  const [categories, popular, brands, productCount, posts, caseStudies] = await Promise.all([
    homeService.categories(),
    homeService.popularProducts(8),
    homeService.brands(),
    homeService.productCount(),
    postService.list(3),
    caseStudyService.list(3),
  ]);

  return (
    <>
      <Hero categories={categories} productCount={productCount} />
      <Categories categories={categories} />
      <PopularProducts products={popular} />
      <Manufacturers brands={brands} />
      <Features />
      <Process />
      <Projects caseStudies={caseStudies} />
      <Articles posts={posts} />
      <Cta />
    </>
  );
}
