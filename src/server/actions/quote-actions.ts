"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { quoteRepository } from "@/server/repositories";
import { quoteSchema, type QuoteInput } from "@/lib/validations/quote";
import { rateLimit } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logger";
import { tengeToTiyn } from "@/lib/money";
import { notificationService } from "@/server/services/notification-service";
import { currentUser } from "@/server/auth/session";
import { resolveCatalogPrices } from "@/server/services/company-price-service";
import { crmService } from "@/server/services/crm-service";

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
    // Link the quote to the submitter's account when they're signed in, so it
    // shows up in "Мои заявки" on /account — this was previously never set.
    const user = await currentUser();
    // Every item here carries a real productId (enforced by quoteItemSchema),
    // so every price is re-derived server-side in one bulk lookup — the
    // client-sent priceTenge is never trusted, same as the Project/BOM flow.
    const prices = await resolveCatalogPrices(items.map((i) => i.productId));

    // Link to (or create) a CRM Customer by exact phone/email match, and
    // assign an owner via round-robin if the resolved customer doesn't have
    // one yet. Enrichment, not core: a failure here must never block the
    // quote itself from being submitted.
    let customerId: string | null = null;
    try {
      const customer = await crmService.linkCustomerForQuote({
        company: parsed.data.company,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
      });
      customerId = customer.id;
    } catch (e) {
      logger.error("quote.customer_link_failed", { error: String(e) });
    }

    const quote = await quoteRepository.create({
      title: parsed.data.title || null,
      company: parsed.data.company,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      message: parsed.data.message || (items.length > 0 ? "Заявка из проекта (см. позиции)" : ""),
      approvalToken: crypto.randomUUID(),
      ...(user ? { user: { connect: { id: user.id } } } : {}),
      ...(customerId ? { customer: { connect: { id: customerId } } } : {}),
      items: items.length
        ? {
            create: items.map((i) => {
              const priceTenge = prices.get(i.productId) ?? null;
              return {
                productId: i.productId,
                sku: i.sku || null,
                title: i.title,
                qty: i.qty,
                unit: i.unit,
                amountTiyn: priceTenge != null ? tengeToTiyn(priceTenge) : null,
                note: i.note || null,
              };
            }),
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
    if (customerId) {
      revalidatePath("/admin/crm/customers");
      revalidatePath(`/admin/crm/customers/${customerId}`);
    }
    await notificationService.notifyStaff({
      type: "quote.created",
      title: `Новая заявка: ${parsed.data.company}`,
      body: items.length > 0 ? `${items.length} позиц. · ${parsed.data.name}` : parsed.data.name,
      link: "/admin/quotes",
    });
    return { ok: true };
  } catch (e) {
    logger.error("quote.create_failed", { error: String(e) });
    return { ok: false, error: "Не удалось отправить заявку. Попробуйте позже." };
  }
}
