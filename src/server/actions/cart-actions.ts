"use server";

import { headers } from "next/headers";
import { renderToBuffer } from "@react-pdf/renderer";
import { z } from "zod";

import { rateLimit } from "@/lib/security/rate-limit";
import { rowsToWorkbook } from "@/lib/import/parse-sheet";
import { CartSpecPdfDocument } from "@/lib/pdf/cart-spec-pdf";
import { resolveCartRefs, type CartRef } from "@/server/services/cart-service";
import { cartShareRepository } from "@/server/repositories";
import { ok, fail, type ActionResult } from "@/server/actions/action-result";
import type { CartItem } from "@/types/cart";

const cartRefSchema = z.object({
  productId: z.string().min(1).max(60),
  qty: z.number().positive().max(1_000_000),
});
const cartRefsSchema = z.array(cartRefSchema).min(1).max(200);

async function clientIp(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
}

export interface CartExportResult {
  base64: string;
  filename: string;
  droppedCount: number;
}

/**
 * Exports the current cart as an .xlsx spec sheet. Prices/titles are always
 * re-resolved from the live catalog by productId (see resolveCartRefs), not
 * trusted from the client, so the export can't be forged into showing
 * arbitrary numbers.
 */
export async function exportCartXlsx(refs: CartRef[]): Promise<ActionResult<CartExportResult>> {
  const limit = rateLimit(`cart-export:${await clientIp()}`, 20, 60_000);
  if (!limit.ok) return fail("Слишком много запросов. Подождите минуту.");

  const parsed = cartRefsSchema.safeParse(refs);
  if (!parsed.success) return fail("Проект пуст или повреждён");

  const { items, droppedCount } = await resolveCartRefs(parsed.data);
  if (items.length === 0) return fail("Ни одной позиции не удалось найти в каталоге");

  const sheetRows = items.map((i) => ({
    Артикул: i.sku,
    Наименование: i.title,
    "Кол-во": i.qty,
    Ед: i.unit,
    "Цена, ₸": i.priceTenge ?? "",
    "Сумма, ₸": i.priceTenge !== null ? i.priceTenge * i.qty : "",
  }));
  const buffer = rowsToWorkbook(sheetRows, "Спецификация");
  const base64 = Buffer.from(buffer).toString("base64");
  const filename = `specifikaciya-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return ok({ base64, filename, droppedCount });
}

/** Same re-resolution as exportCartXlsx, rendered as a PDF spec sheet with real AIMAG requisites. */
export async function exportCartPdf(refs: CartRef[]): Promise<ActionResult<CartExportResult>> {
  const limit = rateLimit(`cart-export:${await clientIp()}`, 20, 60_000);
  if (!limit.ok) return fail("Слишком много запросов. Подождите минуту.");

  const parsed = cartRefsSchema.safeParse(refs);
  if (!parsed.success) return fail("Проект пуст или повреждён");

  const { items, droppedCount } = await resolveCartRefs(parsed.data);
  if (items.length === 0) return fail("Ни одной позиции не удалось найти в каталоге");

  const buffer = await renderToBuffer(
    CartSpecPdfDocument({
      items: items.map((i) => ({
        title: i.title,
        sku: i.sku,
        qty: i.qty,
        unit: i.unit,
        priceTenge: i.priceTenge,
      })),
    })
  );
  const base64 = Buffer.from(buffer).toString("base64");
  const filename = `specifikaciya-${new Date().toISOString().slice(0, 10)}.pdf`;

  return ok({ base64, filename, droppedCount });
}

function randomShortCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

/** Persists (productId, qty) only — never title/price, see cart-share model comment in schema.prisma. */
export async function shareCart(items: CartItem[]): Promise<ActionResult<{ code: string }>> {
  const limit = rateLimit(`cart-share:${await clientIp()}`, 10, 60_000);
  if (!limit.ok) return fail("Слишком много запросов. Подождите минуту.");

  const refs = items
    .filter((i) => i.productId && i.qty > 0)
    .map((i) => ({ productId: i.productId, qty: i.qty }));
  const parsed = cartRefsSchema.safeParse(refs);
  if (!parsed.success) return fail("Проект пуст");

  const code = randomShortCode();
  try {
    await cartShareRepository.create(code, parsed.data);
    return ok({ code });
  } catch {
    return fail("Не удалось создать ссылку. Попробуйте ещё раз.");
  }
}

export interface SharedCartResult {
  items: CartItem[];
  droppedCount: number;
}

/** Public lookup for /cart/s/[code] — re-resolves fresh data, see resolveCartRefs. */
export async function getSharedCart(code: string): Promise<ActionResult<SharedCartResult>> {
  const share = await cartShareRepository.findByCode(code);
  if (!share) return fail("Ссылка не найдена или устарела");

  const refsParsed = cartRefsSchema.safeParse(share.items);
  if (!refsParsed.success) return fail("Ссылка повреждена");

  const resolved = await resolveCartRefs(refsParsed.data);
  return ok(resolved);
}
