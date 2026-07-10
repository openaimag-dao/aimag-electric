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
import { homeService } from "@/server/services";

/**
 * AIMAG ELECTRIC — homepage. All catalog-driven sections (Hero links,
 * Categories, Popular products, Manufacturers) are sourced from the database
 * via homeService; static marketing sections (Features, Process, Projects,
 * Articles) remain in config as editorial content.
 */
export default async function HomePage() {
  const [categories, popular, brands] = await Promise.all([
    homeService.categories(),
    homeService.popularProducts(8),
    homeService.brands(),
  ]);

  return (
    <>
      <Hero categories={categories} />
      <Categories categories={categories} />
      <PopularProducts products={popular} />
      <Manufacturers brands={brands} />
      <Features />
      <Process />
      <Projects />
      <Articles />
      <Cta />
    </>
  );
}
