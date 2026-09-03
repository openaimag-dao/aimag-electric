import "server-only";

import type { Customer } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { tiynToTenge } from "@/lib/money";
import { normalizePhone } from "@/lib/phone";

const STAGE_ORDER = ["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;

export const crmService = {
  /** Pipeline snapshot: totals and value per stage (in тенге). */
  async pipeline() {
    const grouped = await prisma.deal.groupBy({
      by: ["stage"],
      _count: true,
      _sum: { amount: true },
    });
    const byStage = new Map(
      grouped.map((g) => [
        g.stage as string,
        { count: (g._count as number) ?? 0, amount: g._sum?.amount ?? 0 },
      ])
    );
    return STAGE_ORDER.map((stage) => {
      const s = byStage.get(stage) ?? { count: 0, amount: 0 };
      return { stage, count: s.count, valueTenge: tiynToTenge(s.amount ?? 0) };
    });
  },

  /**
   * Resolves the Customer a new quote should link to: an existing one
   * matched by phone or email, or a freshly created LEAD when neither
   * matches. Assigns an owner (round-robin by current load among
   * ADMIN/MANAGER staff) only when the resolved customer doesn't already
   * have one — never reassigns an existing owner.
   *
   * Phone matching compares the last 10 digits (the real KZ/RU subscriber
   * number) so `+7 701 234 56 78`, `8 701 234 56 78` and `87012345678`
   * all link to the same customer regardless of spacing or trunk prefix.
   * Email matching is case-insensitive. Still not fuzzy: a customer who
   * changed company but kept the same number will link to their old
   * record — the literal trade-off of matching on contact details rather
   * than a stronger identity signal this app doesn't have.
   */
  async linkCustomerForQuote(input: {
    company: string;
    name: string;
    phone: string;
    email: string | null;
  }) {
    const phone = input.phone.trim();
    const email = input.email?.trim().toLowerCase() || null;
    const normalizedPhone = normalizePhone(phone);

    let customer: Customer | null = null;
    if (normalizedPhone) {
      const rows = await prisma.$queryRaw<Customer[]>`
        SELECT * FROM "Customer"
        WHERE phone IS NOT NULL
          AND right(regexp_replace(phone, '\D', '', 'g'), 10) = ${normalizedPhone}
        LIMIT 1
      `;
      customer = rows[0] ?? null;
    }
    if (!customer && email) {
      customer = await prisma.customer.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });
    }

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          company: input.company,
          contact: input.name,
          phone: phone || null,
          email,
          status: "LEAD",
        },
      });
    }

    if (!customer.ownerId) {
      const ownerId = await crmService.nextRoundRobinOwner();
      if (ownerId) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: { owner: { connect: { id: ownerId } } },
        });
      }
    }

    return customer;
  },

  /**
   * Least-loaded ADMIN/MANAGER by current owned-customer count — a
   * self-balancing rotation that needs no separate cursor/counter state:
   * whoever owns the fewest customers right now gets the next one, ties
   * broken by account age. Returns null when no staff exists to assign to.
   */
  async nextRoundRobinOwner(): Promise<string | null> {
    const managers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] } },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    if (managers.length === 0) return null;

    const counts = await prisma.customer.groupBy({
      by: ["ownerId"],
      _count: true,
      where: { ownerId: { in: managers.map((m) => m.id) } },
    });
    const countByOwner = new Map(counts.map((c) => [c.ownerId, (c._count as number) ?? 0]));

    let best = managers[0].id;
    let bestCount = countByOwner.get(best) ?? 0;
    for (const m of managers.slice(1)) {
      const n = countByOwner.get(m.id) ?? 0;
      if (n < bestCount) {
        best = m.id;
        bestCount = n;
      }
    }
    return best;
  },

  /** Headline CRM counters for the dashboard. */
  async stats() {
    const now = new Date();
    const [customers, leads, openDeals, wonDeals, overdueTasks, wonSum] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: "LEAD" } }),
      prisma.deal.count({ where: { stage: { notIn: ["WON", "LOST"] } } }),
      prisma.deal.count({ where: { stage: "WON" } }),
      prisma.activity.count({ where: { type: "TASK", done: false, dueAt: { lt: now } } }),
      prisma.deal.aggregate({ where: { stage: "WON" }, _sum: { amount: true } }),
    ]);
    return {
      customers,
      leads,
      openDeals,
      wonDeals,
      overdueTasks,
      wonValueTenge: tiynToTenge(wonSum._sum?.amount ?? 0),
    };
  },
};
