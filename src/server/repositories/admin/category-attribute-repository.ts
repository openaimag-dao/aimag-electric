import "server-only";

import { prisma } from "@/lib/prisma";
import { tableSelfHeal } from "@/lib/db-self-heal";

const withTable = tableSelfHeal([
  `CREATE TABLE IF NOT EXISTS "CategoryAttribute" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CategoryAttribute_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "CategoryAttribute_categoryId_idx" ON "CategoryAttribute"("categoryId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CategoryAttribute_categoryId_attributeId_key" ON "CategoryAttribute"("categoryId", "attributeId")`,
  `ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
]);

export interface CategoryAttributeItem {
  attributeId: string;
  required: boolean;
  order: number;
}

export const categoryAttributeRepository = {
  listForCategory(categoryId: string) {
    return withTable(() =>
      prisma.categoryAttribute.findMany({
        where: { categoryId },
        orderBy: { order: "asc" },
        include: { attribute: true },
      })
    );
  },
  /** Replaces the whole template for a category in one transaction. */
  setForCategory(categoryId: string, items: CategoryAttributeItem[]) {
    return withTable(() =>
      prisma.$transaction([
        prisma.categoryAttribute.deleteMany({ where: { categoryId } }),
        ...items.map((item, i) =>
          prisma.categoryAttribute.create({
            data: {
              categoryId,
              attributeId: item.attributeId,
              required: item.required,
              order: item.order ?? i,
            },
          })
        ),
      ])
    );
  },
};
