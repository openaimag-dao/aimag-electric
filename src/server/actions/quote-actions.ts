"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { quoteRepository } from "@/server/repositories";
import { quoteSchema, type QuoteInput } from "@/lib/validations/quote";
import { rateLimit } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logger";
import { tengeToTiyn } from "@/lib/money";

export interface QuoteActionState {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof QuoteInput, string>>;
}

/**
 * Server Action: persist a quote request to the DB. Validates on the server
 * with the same Zod schema used on the client. Rate-limited per client IP to
 * curb spam/abuse.
 */
export async function submitQuote(input: QuoteInput): Promise<QuoteActionState> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
  const limit = rateLimit(`quote:${ip}`, 5, 60_000);
  if (!limit.ok) {
    return { ok: false, error: "Слишком много заявок. Подождите минуту и попробуйте снова." };
  }

  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors = Object.fromEntries(
      Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ""])
    ) as QuoteActionState["fieldErrors"];
    return { ok: false, error: "Проверьте заполнение формы", fieldErrors };
  }

  try {
    const items = parsed.data.items ?? [];
    const quote = await quoteRepository.create({
      title: parsed.data.title || null,
      company: parsed.data.company,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      message: parsed.data.message || (items.length > 0 ? "Заявка из проекта (см. позиции)" : ""),
      items: items.length
        ? {
            create: items.map((i) => ({
              productId: i.productId,
              sku: i.sku || null,
              title: i.title,
              qty: i.qty,
              unit: i.unit,
              amountTiyn: i.priceTenge !== null ? tengeToTiyn(i.priceTenge) : null,
            })),
          }
        : undefined,
    });
    logger.info("quote.created", {
      quoteId: quote.id,
      company: parsed.data.company,
      items: items.length,
    });
    revalidatePath("/admin/quotes");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    logger.error("quote.create_failed", { error: String(e) });
    return { ok: false, error: "Не удалось отправить заявку. Попробуйте позже." };
  }
}
