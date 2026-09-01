"use server";

import { requireUser } from "@/lib/security/rbac";
import { rateLimit } from "@/lib/security/rate-limit";
import { parseSheet } from "@/lib/import/parse-sheet";
import { SPEC_IMPORT_COLUMNS } from "@/config/spec-import-columns";
import {
  matchSpecRows,
  type MatchedSpecRow,
  type SpecFileRow,
} from "@/server/services/spec-match-service";
import { ok, fail, type ActionResult } from "@/server/actions/action-result";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ — таблицы, не сканы
const MAX_ROWS = 300;
const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

export interface SpecMatchSummary {
  total: number;
  exact: number;
  possible: number;
  notFound: number;
}

/**
 * "Загрузить ТЗ": parses an .xlsx/.xls/.csv the user uploads and matches
 * each row against real published catalog products (deterministic — SKU
 * exact + normalized title similarity, see lib/spec-import/matcher.ts). The
 * file itself is never stored; only the matched rows go back to the client
 * for review before anything is written to a project.
 */
export async function matchSpecificationFile(
  formData: FormData
): Promise<ActionResult<{ summary: SpecMatchSummary; rows: MatchedSpecRow[] }>> {
  const user = await requireUser();

  const limit = rateLimit(`spec-import:${user.id}`, 10, 60_000);
  if (!limit.ok) return fail("Слишком много попыток, попробуйте через минуту");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Файл не выбран");
  if (file.size > MAX_FILE_SIZE) return fail("Файл слишком большой (максимум 5 МБ)");

  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return fail("Поддерживаются только .xlsx, .xls и .csv");
  }

  let parsed;
  try {
    const buffer = await file.arrayBuffer();
    parsed = parseSheet(buffer, SPEC_IMPORT_COLUMNS);
  } catch {
    return fail("Не удалось прочитать файл — проверьте формат");
  }

  if (parsed.missingRequired.length > 0) {
    return fail(`В файле нет обязательной колонки: ${parsed.missingRequired.join(", ")}`);
  }
  if (parsed.rows.length === 0) {
    return fail("Не удалось прочитать ни одной строки");
  }
  if (parsed.rows.length > MAX_ROWS) {
    return fail(
      `Слишком много строк (${parsed.rows.length}). Разделите файл — максимум ${MAX_ROWS} за раз`
    );
  }

  const specRows: SpecFileRow[] = parsed.rows
    .map((r, i): SpecFileRow => {
      const qty = Number(String(r.quantity ?? "").replace(",", "."));
      const voltageMatch = String(r.voltage ?? "")
        .replace(",", ".")
        .match(/-?\d+(\.\d+)?/);
      const voltage = voltageMatch ? Number(voltageMatch[0]) : null;
      return {
        row: i + 2, // +1 for the header row, +1 for 1-based numbering
        sku: (r.sku ?? "").trim(),
        title: (r.title ?? "").trim(),
        qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
        unit: (r.unit ?? "").trim() || "шт",
        manufacturer: (r.manufacturer ?? "").trim(),
        voltage: voltage !== null && Number.isFinite(voltage) ? voltage : null,
      };
    })
    .filter((r) => r.title.length > 0);

  if (specRows.length === 0) return fail("В файле нет строк с наименованием товара");

  const rows = await matchSpecRows(specRows);
  const summary: SpecMatchSummary = {
    total: rows.length,
    exact: rows.filter((r) => r.result.tier === "exact").length,
    possible: rows.filter((r) => r.result.tier === "possible").length,
    notFound: rows.filter((r) => r.result.tier === "not_found").length,
  };

  return ok({ summary, rows });
}
