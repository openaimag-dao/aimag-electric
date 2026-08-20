import "server-only";

import { prisma } from "@/lib/prisma";

export const notificationRepository = {
  create(data: { type: string; title: string; body?: string | null; link?: string | null }) {
    return prisma.notification.create({ data });
  },
  listRecent(take = 20) {
    return prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take });
  },
  unreadCount() {
    return prisma.notification.count({ where: { readAt: null } });
  },
  markRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  },
  markAllRead() {
    return prisma.notification.updateMany({
      where: { readAt: null },
      data: { readAt: new Date() },
    });
  },
};
