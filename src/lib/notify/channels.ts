import "server-only";

import { logger } from "@/lib/logger";

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
    const text = [event.title, event.body, event.link].filter(Boolean).join("\n");
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      logger.error("notify.telegram_failed", { status: res.status });
    }
  },
};

export const notifyChannels: NotifyChannel[] = [logChannel, telegramChannel];
