"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";

import { quoteRepository } from "@/server/repositories";
import {
  dataCenterQuoteSchema,
  type DataCenterQuoteInput,
} from "@/lib/validations/data-center-quote";
import { rateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { logger } from "@/lib/logger";
import { notificationService } from "@/server/services/notification-service";
import { crmService } from "@/server/services/crm-service";
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE, formatFileSize } from "@/lib/uploads";
import { ok, fail, type ActionResult } from "@/server/actions/action-result";

export interface DataCenterQuoteActionState {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof DataCenterQuoteInput, string>>;
}

function clientIp(hdrs: Headers): string {
  return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
}

/**
 * Public upload for a spec file attached to the data-center B2B RFQ form —
 * unlike uploadDocumentFile in admin/document-actions.ts, this has no
 * requireStaff() (the submitter isn't signed in), so it leans on rate
 * limiting plus the same type/size allowlist instead.
 */
export async function uploadDataCenterSpec(
  formData: FormData
): Promise<ActionResult<{ url: string; title: string; size: string }>> {
  const hdrs = await headers();
  const ip = clientIp(hdrs);
  const limit = rateLimit(`dc-spec-upload:${ip}`, 10, 60_000);
  if (!limit.ok) return fail("Слишком много загрузок. Подождите минуту и попробуйте снова.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Файл не выбран");
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return fail("Поддерживаются только PDF, DOC(X), XLS(X)");
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return fail(`Файл слишком большой (макс. ${formatFileSize(MAX_DOCUMENT_SIZE)})`);
  }
  try {
    const blob = await put(`data-center-specs/${crypto.randomUUID()}-${file.name}`, file, {
      access: "public",
    });
    return ok({ url: blob.url, title: file.name, size: formatFileSize(file.size) });
  } catch (e) {
    logger.error("data_center_quote.upload_failed", { error: String(e) });
    return fail("Не удалось загрузить файл. Попробуйте позже.");
  }
}

/**
 * Persists a data-center B2B RFQ. Writes to the existing Quote/QuoteDocument
 * tables (requestType: "DATA_CENTER_B2B") rather than a parallel table —
 * same CRM auto-link, same admin list, same notifications as every other
 * quote. Item lines have no real productId (most of this equipment isn't
 * in stock, only sourced to order), so they're folded into the free-text
 * message instead of QuoteItem rows, which require one.
 */
export async function submitDataCenterQuote(
  input: DataCenterQuoteInput
): Promise<DataCenterQuoteActionState> {
  const hdrs = await headers();
  const ip = clientIp(hdrs);
  const limit = rateLimit(`dc-quote:${ip}`, 5, 60_000);
  if (!limit.ok) {
    return { ok: false, error: "Слишком много заявок. Подождите минуту и попробуйте снова." };
  }

  const parsed = dataCenterQuoteSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors = Object.fromEntries(
      Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ""])
    ) as DataCenterQuoteActionState["fieldErrors"];
    return { ok: false, error: "Проверьте заполнение формы", fieldErrors };
  }

  const humanVerified = await verifyTurnstile(parsed.data.turnstileToken, ip);
  if (!humanVerified) {
    return {
      ok: false,
      error: "Не удалось подтвердить, что вы не робот. Обновите страницу и попробуйте снова.",
    };
  }

  const { data } = parsed;
  const items = data.items ?? [];
  const itemLines = items.map((i) => `• ${i.title} — ${i.qty} ${i.unit}`).join("\n");
  const message = [
    data.comment?.trim() || "",
    itemLines ? `Перечень оборудования:\n${itemLines}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    let customerId: string | null = null;
    try {
      const customer = await crmService.linkCustomerForQuote({
        company: data.company,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
      });
      customerId = customer.id;
    } catch (e) {
      logger.error("data_center_quote.customer_link_failed", { error: String(e) });
    }

    const quote = await quoteRepository.create({
      title: "Оборудование для дата-центра",
      sourcePath: data.sourcePath ?? "/data-center",
      company: data.company,
      bin: data.bin || null,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      region: data.region || null,
      categories: data.categories.join(", "),
      requestType: "DATA_CENTER_B2B",
      message: message || "Заявка на оборудование для дата-центра (см. категории)",
      approvalToken: crypto.randomUUID(),
      ...(customerId ? { customer: { connect: { id: customerId } } } : {}),
      documents: data.documents?.length
        ? { create: data.documents.map((d) => ({ title: d.title, url: d.url, size: d.size })) }
        : undefined,
    });

    logger.info("data_center_quote.created", {
      quoteId: quote.id,
      company: data.company,
      categories: data.categories.length,
    });
    revalidatePath("/admin/quotes");
    revalidatePath("/admin");
    if (customerId) {
      revalidatePath("/admin/crm/customers");
      revalidatePath(`/admin/crm/customers/${customerId}`);
    }
    await notificationService.notifyStaff({
      type: "quote.created",
      title: `Заявка ЦОД: ${data.company}`,
      body: `${data.categories.join(", ")} · ${data.name}`,
      link: `/admin/quotes?quote=${quote.id}`,
    });
    return { ok: true };
  } catch (e) {
    logger.error("data_center_quote.create_failed", { error: String(e) });
    return { ok: false, error: "Не удалось отправить заявку. Попробуйте позже." };
  }
}
