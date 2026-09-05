/**
 * Import pipeline types. Shared between the SheetJS parser, the client preview
 * UI, and the server apply action.
 */

/** Which entity a sheet/import targets. */
export type ImportKind = "products" | "categories" | "brands" | "prices" | "stock";

export const IMPORT_KIND_LABELS: Record<ImportKind, string> = {
  products: "Товары",
  categories: "Категории",
  brands: "Производители",
  prices: "Цены",
  stock: "Остатки",
};

export type IssueLevel = "error" | "warning";

/** A single validation issue tied to a row (1-based) and optionally a column. */
export interface ImportIssue {
  row: number;
  column?: string;
  level: IssueLevel;
  message: string;
}

/** Operation planned for a validated row. */
export type RowAction = "create" | "update" | "skip";

/** A normalized, validated row ready to preview and (if valid) apply. */
export interface PreparedRow<T = Record<string, unknown>> {
  /** 1-based row number in the source sheet (accounting for the header). */
  row: number;
  action: RowAction;
  data: T;
  issues: ImportIssue[];
  /** Human summary shown in the preview table. */
  summary: string;
}

/** Result of parsing + validating a file, before applying. */
export interface ImportPreview<T = Record<string, unknown>> {
  kind: ImportKind;
  fileName: string;
  columns: string[];
  totalRows: number;
  rows: PreparedRow<T>[];
  counts: {
    create: number;
    update: number;
    skip: number;
    errors: number;
    warnings: number;
  };
}

/** Outcome of applying a batch. */
export interface ImportResult {
  ok: boolean;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  /** Per-row failures encountered while writing to the DB. */
  errors: ImportIssue[];
  message?: string;
}

/** Column templates advertised to the user for each import kind. */
export interface ColumnSpec {
  key: string;
  label: string;
  required: boolean;
  hint?: string;
  aliases: string[];
}
