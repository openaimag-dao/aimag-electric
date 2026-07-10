import "server-only";

import { prisma } from "@/lib/prisma";
import { tiynToTenge } from "@/lib/money";

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
      grouped.map((g) => [g.stage as string, { count: (g._count as number) ?? 0, amount: g._sum?.amount ?? 0 }])
    );
    return STAGE_ORDER.map((stage) => {
      const s = byStage.get(stage) ?? { count: 0, amount: 0 };
      return { stage, count: s.count, valueTenge: tiynToTenge(s.amount ?? 0) };
    });
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
