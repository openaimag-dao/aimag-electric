import "server-only";

import { logger } from "@/lib/logger";
import { siteConfig } from "@/config/site";

export interface NotifyEvent {
  title: string;
  body?: string;
  link?: string;
}

export interface NotifyChannel {
  name: string;
  send(event: NotifyEvent): Promise<void>;
}

/** Always-on: a structured log line, visible in Vercel runtime logs. */
export const logChannel: NotifyChannel = {
  name: "log",
  async send(event) {
    logger.info("notify.dispatch", { channel: "log", ...event });
  },
};

let warnedNoTelegram = false;

/**
 * Real Telegram Bot API channel. Get a token from @BotFather, message the
 * bot once, then read the chat id from
 * https://api.telegram.org/bot<token>/getUpdates. Without both env vars this
 * is a no-op (warns once) — not a fake send.
 */
export const telegramChannel: NotifyChannel = {
  name: "telegram",
  async send(event) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      if (!warnedNoTelegram) {
        logger.warn("notify.telegram_not_configured", {
          hint: "Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable",
        });
        warnedNoTelegram = true;
      }
      return;
    }
    const link = event.link?.startsWith("/")
      ? new URL(event.link, siteConfig.url).toString()
      : event.link;
    const text = [event.title, event.body, link].filter(Boolean).join("\n");
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        logger.error("notify.telegram_failed", { status: res.status });
        return;
      }
      const result: { ok?: boolean } = await res.json();
      if (result.ok !== true) logger.error("notify.telegram_rejected", {});
    } catch {
      // Fetch errors can contain the URL (including the bot token). Never log them.
      logger.error("notify.telegram_unavailable", { reason: "timeout_or_network" });
    }
  },
};

export const notifyChannels: NotifyChannel[] = [logChannel, telegramChannel];
