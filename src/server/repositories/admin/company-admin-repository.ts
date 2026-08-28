import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { tableSelfHeal } from "@/lib/db-self-heal";

const withTables = tableSelfHeal([
  `CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bin" TEXT,
    "legalAddress" TEXT,
    "actualAddress" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Company_bin_key" ON "Company"("bin")`,
  `CREATE INDEX IF NOT EXISTS "Company_name_idx" ON "Company"("name")`,
  `CREATE TABLE IF NOT EXISTS "CompanyMember" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyMember_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CompanyMember_companyId_userId_key" ON "CompanyMember"("companyId", "userId")`,
  `CREATE INDEX IF NOT EXISTS "CompanyMember_companyId_idx" ON "CompanyMember"("companyId")`,
  `CREATE INDEX IF NOT EXISTS "CompanyMember_userId_idx" ON "CompanyMember"("userId")`,
  `ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
]);

export const companyAdminRepository = {
  list() {
    return withTables(() =>
      prisma.company.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { members: true } } },
      })
    );
  },
  byId(id: string) {
    return withTables(() =>
      prisma.company.findUnique({
        where: { id },
        include: {
          members: {
            // Never pull passwordHash/emailVerified into a nested include — this
            // result reaches the client (getCompany server action), so only
            // fetch what the UI actually needs, not the full User row.
            select: {
              id: true,
              userId: true,
              role: true,
              createdAt: true,
              user: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      })
    );
  },
  create(data: Prisma.CompanyCreateInput) {
    return withTables(() => prisma.company.create({ data }));
  },
  update(id: string, data: Prisma.CompanyUpdateInput) {
    return withTables(() => prisma.company.update({ where: { id }, data }));
  },
  remove(id: string) {
    return withTables(() => prisma.company.delete({ where: { id } }));
  },

  addMember(companyId: string, userId: string, role: Prisma.CompanyMemberCreateInput["role"]) {
    return withTables(() =>
      prisma.companyMember.create({
        data: { company: { connect: { id: companyId } }, user: { connect: { id: userId } }, role },
      })
    );
  },
  updateMemberRole(id: string, role: Prisma.CompanyMemberUpdateInput["role"]) {
    return withTables(() => prisma.companyMember.update({ where: { id }, data: { role } }));
  },
  removeMember(id: string) {
    return withTables(() => prisma.companyMember.delete({ where: { id } }));
  },
  /** Ownership check for self-service team actions — confirms a member row actually belongs to the company the caller claims. */
  memberById(id: string) {
    return withTables(() =>
      prisma.companyMember.findUnique({
        where: { id },
        select: { id: true, companyId: true, userId: true, role: true },
      })
    );
  },

  /** The company (with the caller's role) that this portal user belongs to, if any — powers the account dashboard's company card. */
  forUser(userId: string) {
    return withTables(() =>
      prisma.companyMember.findFirst({
        where: { userId },
        include: { company: true },
      })
    );
  },

  /**
   * The (first) company each of these users belongs to, batched — powers
   * resolving "this quote's company" for every quote on the admin quotes
   * page in one query instead of one `forUser` per quote.
   */
  forUsers(userIds: string[]) {
    if (userIds.length === 0) return Promise.resolve([]);
    return withTables(() =>
      prisma.companyMember.findMany({
        where: { userId: { in: userIds } },
        include: { company: { select: { id: true, name: true } } },
      })
    );
  },

  /** Every company this user belongs to, with their role in each — a user can be VIEWER in one and COMPANY_ADMIN in another. Powers project visibility/write checks. */
  membershipsForUser(userId: string) {
    return withTables(() =>
      prisma.companyMember.findMany({
        where: { userId },
        include: { company: { select: { id: true, name: true } } },
      })
    );
  },
};
