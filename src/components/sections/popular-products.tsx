"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { SectionHeading } from "@/components/common/section-heading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProductCard } from "@/components/catalog/product-card";
import type { CatalogProductDTO } from "@/server/dto";

const ALL = "Все";

export function PopularProducts({ products }: { products: CatalogProductDTO[] }) {
  const categories = React.useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category)));
    return [ALL, ...unique];
  }, []);

  return (
    <section className="border-b border-border bg-secondary/30 py-20 md:py-24">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Витрина"
            title="Популярные позиции"
            description="Часто запрашиваемые марки со склада — добавляйте в КП в один клик."
          />
          <Button asChild variant="outline">
            <Link href="/catalog">
              Смотреть всё
              <ArrowUpRight />
            </Link>
          </Button>
        </div>

        <Tabs defaultValue={ALL} className="mt-10">
          <TabsList>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => {
            const items =
              category === ALL ? products : products.filter((p) => p.category === category);
            return (
              <TabsContent key={category} value={category}>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {items.map((product) => (
                    <ProductCard key={product.slug} product={product} />
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </section>
  );
}
