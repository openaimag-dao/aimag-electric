import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { withCartShareTable } from "@/server/repositories/cart-share-self-heal";

export interface CartShareRef {
  productId: string;
  qty: number;
}

export const cartShareRepository = {
  create(code: string, items: CartShareRef[]) {
    return withCartShareTable(() =>
      prisma.cartShare.create({ data: { code, items: items as unknown as Prisma.InputJsonValue } })
    );
  },
  findByCode(code: string) {
    return withCartShareTable(() => prisma.cartShare.findUnique({ where: { code } }));
  },
};
