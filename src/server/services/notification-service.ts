import "server-only";

import { notificationRepository } from "@/server/repositories/notification-repository";
import { notifyChannels, type NotifyEvent } from "@/lib/notify/channels";
import { logger } from "@/lib/logger";

export interface NotifyStaffInput extends NotifyEvent {
  type: string;
}

export const notificationService = {
  /**
   * Fan out a staff notification: persist it (drives the admin bell) and
   * push it through the external channels. Never throws — a notification
   * failure must not break the action that triggered it (e.g. a quote
   * submission), so every step is best-effort and logged on failure.
   */
  async notifyStaff({ type, title, body, link }: NotifyStaffInput): Promise<void> {
    try {
      await notificationRepository.create({ type, title, body: body ?? null, link: link ?? null });
    } catch (e) {
      logger.error("notify.persist_failed", { type, error: String(e) });
    }
    await Promise.allSettled(notifyChannels.map((c) => c.send({ title, body, link })));
  },
};
