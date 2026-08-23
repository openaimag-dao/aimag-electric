"use server";

import { headers } from "next/headers";

import { quoteRepository } from "@/server/repositories";
import { rateLimit } from "@/lib/security/rate-limit";
import { notificationService } from "@/server/services/notification-service";
import { logger } from "@/lib/logger";

export interface PublicQuoteItem {
  title: string;
  sku: string | null;
  qty: number;
  unit: string;
  amountTiyn: number | null;
}

export interface PublicQuote {
  title: string | null;
  company: string;
  status: string;
  createdAt: string;
  respondedAt: string | null;
  responseNote: string | null;
  items: PublicQuoteItem[];
}

async function clientIp(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
}

/** Public, unauthenticated lookup for /kp/[token] — the token itself is the access control. */
export async function getPublicQuote(token: string): Promise<PublicQuote | null> {
  if (!token || token.length > 100) return null;
  const ip = await clientIp();
  const limit = rateLimit(`kp-view:${ip}`, 30, 60_000);
  if (!limit.ok) return null;

  const quote = await quoteRepository.findByToken(token);
  if (!quote) return null;
  return {
    title: quote.title,
    company: quote.company,
    status: quote.status,
    createdAt: quote.createdAt.toISOString(),
    respondedAt: quote.respondedAt ? quote.respondedAt.toISOString() : null,
    responseNote: quote.responseNote,
    items: quote.items.map((i) => ({
      title: i.title,
      sku: i.sku,
      qty: i.qty,
      unit: i.unit,
      amountTiyn: i.amountTiyn,
    })),
  };
}

export interface RespondResult {
  ok: boolean;
  error?: string;
}

/** Customer approve/reject/request-changes from the public link — only succeeds while the quote is SENT (not already responded to). */
export async function respondToQuote(
  token: string,
  decision: "approve" | "reject" | "changes",
  note?: string
): Promise<RespondResult> {
  if (!token || token.length > 100) return { ok: false, error: "Некорректная ссылка" };
  const ip = await clientIp();
  const limit = rateLimit(`kp-respond:${ip}`, 10, 60_000);
  if (!limit.ok) return { ok: false, error: "Слишком много попыток. Подождите минуту." };

  const cleanNote = (note ?? "").trim().slice(0, 500) || null;
  // "changes" reopens the deal (IN_PROGRESS) instead of closing it (LOST) — the
  // customer wants a revised КП, not to walk away.
  const status = decision === "approve" ? "WON" : decision === "reject" ? "LOST" : "IN_PROGRESS";

  try {
    const quote = await quoteRepository.findByToken(token);
    if (!quote) return { ok: false, error: "КП не найдено" };
    const updated = await quoteRepository.respond(token, status, cleanNote);
    if (!updated) {
      return { ok: false, error: "Это КП уже обработано или ещё не готово к согласованию" };
    }
    const titleByDecision = {
      approve: `КП одобрено клиентом: ${quote.company}`,
      reject: `КП отклонено клиентом: ${quote.company}`,
      changes: `Клиент запросил изменения в КП: ${quote.company}`,
    };
    await notificationService.notifyStaff({
      type: "quote.responded",
      title: titleByDecision[decision],
      body: cleanNote ?? undefined,
      link: "/admin/quotes",
    });
    return { ok: true };
  } catch (e) {
    logger.error("quote.respond_failed", { error: String(e) });
    return { ok: false, error: "Не удалось отправить ответ. Попробуйте позже." };
  }
}
