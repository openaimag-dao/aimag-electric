import * as XLSX from "xlsx";

import type { ColumnSpec, ImportKind } from "@/types/import";
import { IMPORT_COLUMNS } from "@/config/import-columns";

/** Normalize a header for alias matching: lowercase, strip spaces/punctuation. */
function normalizeHeader(h: string): string {
  return String(h)
    .toLowerCase()
    .replace(/[\s._\-/]+/g, "")
    .trim();
}

export interface ParsedSheet {
  /** Canonical-key rows: { sku, title, ... }. */
  rows: Record<string, string>[];
  /** Original headers detected in the file. */
  sourceColumns: string[];
  /** Canonical columns that were successfully mapped. */
  mappedColumns: string[];
  /** Required columns that could not be found. */
  missingRequired: string[];
}

function buildAliasIndex(specs: ColumnSpec[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const spec of specs) {
    index.set(normalizeHeader(spec.key), spec.key);
    index.set(normalizeHeader(spec.label), spec.key);
    for (const alias of spec.aliases) {
      index.set(normalizeHeader(alias), spec.key);
    }
  }
  return index;
}

/**
 * Parse an .xlsx/.xls/.csv ArrayBuffer into canonical-key rows for the given
 * import kind. Header matching is alias-based and forgiving of case/spacing.
 */
export function parseSheet(buffer: ArrayBuffer, kind: ImportKind): ParsedSheet {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    return { rows: [], sourceColumns: [], mappedColumns: [], missingRequired: [] };
  }

  // Read as array-of-arrays to capture the raw header row.
  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: false,
  });
  if (matrix.length === 0) {
    return { rows: [], sourceColumns: [], mappedColumns: [], missingRequired: [] };
  }

  const specs = IMPORT_COLUMNS[kind];
  const aliasIndex = buildAliasIndex(specs);

  const headerRow = matrix[0].map((h) => String(h ?? "").trim());
  // Map each source column index → canonical key (or null if unmapped).
  const colKeys: (string | null)[] = headerRow.map(
    (h) => aliasIndex.get(normalizeHeader(h)) ?? null
  );

  const mappedColumns = Array.from(new Set(colKeys.filter((k): k is string => k !== null)));
  const missingRequired = specs
    .filter((s) => s.required && !mappedColumns.includes(s.key))
    .map((s) => s.label);

  const rows: Record<string, string>[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const raw = matrix[r];
    if (!raw || raw.every((v) => String(v ?? "").trim() === "")) continue; // skip empty
    const obj: Record<string, string> = {};
    for (let c = 0; c < colKeys.length; c++) {
      const key = colKeys[c];
      if (!key) continue;
      obj[key] = String(raw[c] ?? "").trim();
    }
    rows.push(obj);
  }

  return { rows, sourceColumns: headerRow, mappedColumns, missingRequired };
}

/** Generate a downloadable template workbook (headers + one example row). */
export function buildTemplateWorkbook(
  kind: ImportKind,
  headers: string[],
  example: (string | number)[]
): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, kind);
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}

/** Export arbitrary rows (e.g. the error log) to an .xlsx ArrayBuffer. */
export function rowsToWorkbook(
  rows: Record<string, unknown>[],
  sheetName = "Лист1"
): ArrayBuffer {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}
