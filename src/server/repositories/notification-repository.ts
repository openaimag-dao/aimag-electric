import "server-only";

import { prisma } from "@/lib/prisma";

// This DB has no _prisma_migrations history — schema changes ship via
// `db push` or manual DDL, not `migrate deploy`, so a deploy can land a
// Prisma model whose table was never actually created (see
// prisma/migrations/20260820160000_notifications). Self-heal once per
// process instead of depending on someone running the migration by hand.
const CREATE_TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "Notification_readAt_idx" ON "Notification"("readAt")`,
  `CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt")`,
];

let ensured = false;

async function ensureTable() {
  if (ensured) return;
  for (const statement of CREATE_TABLE_STATEMENTS) {
    await prisma.$executeRawUnsafe(statement);
  }
  ensured = true;
}

function isMissingTable(e: unknown) {
  return e instanceof Error && /does not exist/.test(e.message);
}

async function withTable<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (!isMissingTable(e)) throw e;
    await ensureTable();
    return fn();
  }
}

export const notificationRepository = {
  create(data: { type: string; title: string; body?: string | null; link?: string | null }) {
    return withTable(() => prisma.notification.create({ data }));
  },
  listRecent(take = 20) {
    return withTable(() => prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take }));
  },
  unreadCount() {
    return withTable(() => prisma.notification.count({ where: { readAt: null } }));
  },
  markRead(id: string) {
    return withTable(() =>
      prisma.notification.update({ where: { id }, data: { readAt: new Date() } })
    );
  },
  markAllRead() {
    return withTable(() =>
      prisma.notification.updateMany({ where: { readAt: null }, data: { readAt: new Date() } })
    );
  },
};
