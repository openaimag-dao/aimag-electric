"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/security/rbac";
import { notificationRepository } from "@/server/repositories/notification-repository";
import { logger } from "@/lib/logger";

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationsState {
  items: NotificationRow[];
  unread: number;
}

const EMPTY: NotificationsState = { items: [], unread: 0 };

/** Read path is defensive: a not-yet-migrated Notification table must not crash the admin UI. */
export async function listNotifications(): Promise<NotificationsState> {
  await requireStaff();
  try {
    const [items, unread] = await Promise.all([
      notificationRepository.listRecent(20),
      notificationRepository.unreadCount(),
    ]);
    return { items, unread };
  } catch (e) {
    logger.error("notifications.list_failed", { error: String(e) });
    return EMPTY;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await requireStaff();
  try {
    await notificationRepository.markRead(id);
    revalidatePath("/admin");
  } catch (e) {
    logger.error("notifications.mark_read_failed", { id, error: String(e) });
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  await requireStaff();
  try {
    await notificationRepository.markAllRead();
    revalidatePath("/admin");
  } catch (e) {
    logger.error("notifications.mark_all_read_failed", { error: String(e) });
  }
}
