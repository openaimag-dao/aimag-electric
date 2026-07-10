import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Data access for the customer/staff cabinet. Everything is scoped to the
 * signed-in user's id so a customer only ever sees their own records.
 */
export const accountRepository = {
  /** The customer profile(s) linked to this portal user, with quotes + deals. */
  async customerData(userId: string) {
    const customers = await prisma.customer.findMany({
      where: { userId },
      include: {
        deals: { orderBy: { createdAt: "desc" } },
        quotes: { orderBy: { createdAt: "desc" }, include: { items: true } },
      },
    });
    return customers;
  },

  /** Quotes tied to this user directly (submitted while logged in). */
  quotesByUser(userId: string) {
    return prisma.quote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  },

  /** Staff workload: customers and deals they own. */
  async staffWorkload(userId: string) {
    const [ownedCustomers, ownedDeals, openTasks] = await Promise.all([
      prisma.customer.count({ where: { ownerId: userId } }),
      prisma.deal.findMany({
        where: { ownerId: userId, stage: { notIn: ["WON", "LOST"] } },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { customer: { select: { company: true } } },
      }),
      prisma.activity.count({
        where: { type: "TASK", done: false },
      }),
    ]);
    return { ownedCustomers, ownedDeals, openTasks };
  },
};
