import "server-only";

import type { Prisma, AuditAction, AuditLog } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface AuditLogFilterParams {
  q?: string;
  action?: AuditAction;
  entity?: string;
  from?: Date;
  to?: Date;
}

export interface AuditLogListParams extends AuditLogFilterParams {
  page: number;
  pageSize: number;
}

function buildWhere(params: AuditLogFilterParams): Prisma.AuditLogWhereInput {
  return {
    ...(params.q
      ? {
          OR: [
            { summary: { contains: params.q, mode: "insensitive" } },
            { entity: { contains: params.q, mode: "insensitive" } },
            { actorEmail: { contains: params.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(params.action ? { action: params.action } : {}),
    ...(params.entity ? { entity: params.entity } : {}),
    ...(params.from || params.to
      ? {
          createdAt: {
            ...(params.from ? { gte: params.from } : {}),
            ...(params.to ? { lte: params.to } : {}),
          },
        }
      : {}),
  };
}

export const auditLogAdminRepository = {
  /** Server-side filtered + paginated — this table only grows, never load it whole. */
  async listPage(params: AuditLogListParams) {
    const where = buildWhere(params);
    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { rows, total };
  },
  /** Distinct entity values seen so far, for the filter dropdown — cheap enough to run per page load, entity cardinality is small (Product, Category, Quote, User, Auth, …). */
  async listEntities(): Promise<string[]> {
    const rows = await prisma.auditLog.findMany({
      distinct: ["entity"],
      select: { entity: true },
      orderBy: { entity: "asc" },
    });
    return rows.map((r) => r.entity);
  },
};

export type AuditLogAdminRow = AuditLog;
