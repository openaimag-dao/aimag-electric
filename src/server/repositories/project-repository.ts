import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { tableSelfHeal } from "@/lib/db-self-heal";

const withTable = tableSelfHeal([
  `CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "objectName" TEXT,
    "region" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "deadline" TIMESTAMP(3),
    "companyId" TEXT,
    "ownerId" TEXT NOT NULL,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "Project_companyId_idx" ON "Project"("companyId")`,
  `CREATE INDEX IF NOT EXISTS "Project_ownerId_idx" ON "Project"("ownerId")`,
  `CREATE INDEX IF NOT EXISTS "Project_status_idx" ON "Project"("status")`,
  `CREATE TABLE IF NOT EXISTS "ProjectItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "productId" TEXT,
    "slug" TEXT,
    "sku" TEXT,
    "title" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'шт',
    "amountTiyn" INTEGER,
    "note" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectItem_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "ProjectItem_projectId_idx" ON "ProjectItem"("projectId")`,
  `ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Project" ADD CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "ProjectItem" ADD CONSTRAINT "ProjectItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
]);

/** A user may see a project if they own it, or it belongs to a company they're a member of — never anyone else's. */
function accessWhere(userId: string, companyIds: string[]): Prisma.ProjectWhereInput["OR"] {
  const or: Prisma.ProjectWhereInput["OR"] = [{ ownerId: userId }];
  if (companyIds.length > 0) or.push({ companyId: { in: companyIds } });
  return or;
}

export class ProjectAccessError extends Error {
  constructor() {
    super("Проект не найден или недоступен");
    this.name = "ProjectAccessError";
  }
}

async function assertAccess(projectId: string, userId: string, companyIds: string[]) {
  return withTable(async () => {
    const project = await prisma.project.findFirst({
      where: { id: projectId, OR: accessWhere(userId, companyIds) },
      select: { id: true },
    });
    if (!project) throw new ProjectAccessError();
  });
}

export const projectRepository = {
  listForUser(userId: string, companyIds: string[]) {
    return withTable(() =>
      prisma.project.findMany({
        where: { OR: accessWhere(userId, companyIds) },
        include: {
          items: { select: { id: true, qty: true, amountTiyn: true } },
          company: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
      })
    );
  },

  getForUser(id: string, userId: string, companyIds: string[]) {
    return withTable(() =>
      prisma.project.findFirst({
        where: { id, OR: accessWhere(userId, companyIds) },
        include: {
          items: { orderBy: { order: "asc" } },
          company: { select: { id: true, name: true } },
          owner: { select: { name: true, email: true } },
          manager: { select: { name: true, email: true } },
        },
      })
    );
  },

  create(data: Prisma.ProjectCreateInput) {
    return withTable(() => prisma.project.create({ data, include: { items: true } }));
  },

  async updateForUser(
    id: string,
    userId: string,
    companyIds: string[],
    data: Prisma.ProjectUpdateInput
  ) {
    await assertAccess(id, userId, companyIds);
    return withTable(() => prisma.project.update({ where: { id }, data }));
  },

  async removeForUser(id: string, userId: string, companyIds: string[]) {
    await assertAccess(id, userId, companyIds);
    return withTable(() => prisma.project.delete({ where: { id } }));
  },

  async addItem(
    projectId: string,
    userId: string,
    companyIds: string[],
    item: Omit<Prisma.ProjectItemCreateInput, "project">
  ) {
    await assertAccess(projectId, userId, companyIds);
    return withTable(() =>
      prisma.projectItem.create({ data: { ...item, project: { connect: { id: projectId } } } })
    );
  },

  async updateItemQty(
    projectId: string,
    itemId: string,
    userId: string,
    companyIds: string[],
    qty: number
  ) {
    await assertAccess(projectId, userId, companyIds);
    return withTable(() =>
      prisma.projectItem.update({ where: { id: itemId, projectId }, data: { qty } })
    );
  },

  async removeItem(projectId: string, itemId: string, userId: string, companyIds: string[]) {
    await assertAccess(projectId, userId, companyIds);
    return withTable(() => prisma.projectItem.delete({ where: { id: itemId, projectId } }));
  },
};
