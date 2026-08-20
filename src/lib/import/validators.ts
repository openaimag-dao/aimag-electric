import type {
  ImportKind,
  ImportIssue,
  ImportPreview,
  PreparedRow,
  RowAction,
} from "@/types/import";
import { IMPORT_COLUMNS } from "@/config/import-columns";

/** Reference data snapshot used to resolve relations and detect create/update. */
export interface ImportContext {
  categorySlugs: Set<string>;
  categoryTitleToSlug: Map<string, string>;
  brandSlugs: Set<string>;
  brandNameToSlug: Map<string, string>;
  productSkus: Set<string>;
  warehouseCodes: Set<string>;
  warehouseNameToCode: Map<string, string>;
  /** Attribute.key lowercased → { key, type } — resolves "attr:*" import columns case-insensitively. */
  attributesByLowerKey: Map<string, { key: string; type: "STRING" | "NUMBER" | "BOOLEAN" }>;
}

const SLUG_RE = /^[a-z0-9-]+$/;
const BADGES = new Set(["HIT", "NEW", "IN_STOCK"]);
const PRICE_KINDS = new Set(["BASE", "WHOLESALE", "PROMO"]);

function err(row: number, message: string, column?: string): ImportIssue {
  return { row, column, level: "error", message };
}
function warn(row: number, message: string, column?: string): ImportIssue {
  return { row, column, level: "warning", message };
}

function slugify(input: string): string {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  return input
    .toLowerCase()
    .split("")
    .map((ch) => (map[ch] !== undefined ? map[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parseNumber(v: string): number | null {
  if (v === "" || v == null) return null;
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseBool(v: string): boolean {
  const s = String(v).toLowerCase().trim();
  return ["да", "yes", "true", "1", "y", "+", "истина"].includes(s);
}

function checkRequired(
  kind: ImportKind,
  data: Record<string, string>,
  rowNo: number
): ImportIssue[] {
  const issues: ImportIssue[] = [];
  for (const spec of IMPORT_COLUMNS[kind]) {
    if (spec.required && !String(data[spec.key] ?? "").trim()) {
      issues.push(err(rowNo, `Не заполнено обязательное поле «${spec.label}»`, spec.key));
    }
  }
  return issues;
}

function summarize(action: RowAction, label: string): string {
  const verb = action === "create" ? "Создать" : action === "update" ? "Обновить" : "Пропустить";
  return `${verb}: ${label}`;
}

// --- per-kind row validators ----------------------------------------------

function validateCategory(
  data: Record<string, string>,
  rowNo: number,
  ctx: ImportContext
): PreparedRow {
  const issues = checkRequired("categories", data, rowNo);
  const slug = (data.slug || "").trim();
  if (slug && !SLUG_RE.test(slug)) {
    issues.push(err(rowNo, "Slug: только строчная латиница, цифры и дефис", "slug"));
  }
  const order = parseNumber(data.order || "");
  if (data.order && order === null) issues.push(warn(rowNo, "Порядок не число — будет 0", "order"));

  const exists = ctx.categorySlugs.has(slug);
  const action: RowAction = issues.some((i) => i.level === "error")
    ? "skip"
    : exists
      ? "update"
      : "create";

  return {
    row: rowNo,
    action,
    data: { ...data, order: order ?? 0 },
    issues,
    summary: summarize(action, data.title || slug || "—"),
  };
}

function validateBrand(
  data: Record<string, string>,
  rowNo: number,
  ctx: ImportContext
): PreparedRow {
  const issues = checkRequired("brands", data, rowNo);
  const slug = (data.slug || "").trim();
  if (slug && !SLUG_RE.test(slug)) {
    issues.push(err(rowNo, "Slug: только строчная латиница, цифры и дефис", "slug"));
  }
  const exists = ctx.brandSlugs.has(slug);
  const action: RowAction = issues.some((i) => i.level === "error")
    ? "skip"
    : exists
      ? "update"
      : "create";

  return {
    row: rowNo,
    action,
    data,
    issues,
    summary: summarize(action, data.name || slug || "—"),
  };
}

function resolveCategory(value: string, ctx: ImportContext): string | null {
  const v = value.trim();
  if (!v) return null;
  if (ctx.categorySlugs.has(v)) return v;
  const bySlug = slugify(v);
  if (ctx.categorySlugs.has(bySlug)) return bySlug;
  const byTitle = ctx.categoryTitleToSlug.get(v.toLowerCase());
  return byTitle ?? null;
}

function resolveBrand(value: string, ctx: ImportContext): string | null {
  const v = value.trim();
  if (!v) return null;
  if (ctx.brandSlugs.has(v)) return v;
  const bySlug = slugify(v);
  if (ctx.brandSlugs.has(bySlug)) return bySlug;
  const byName = ctx.brandNameToSlug.get(v.toLowerCase());
  return byName ?? null;
}

function validateProduct(
  data: Record<string, string>,
  rowNo: number,
  ctx: ImportContext
): PreparedRow {
  const issues = checkRequired("products", data, rowNo);
  const sku = (data.sku || "").trim();

  // Category / brand must resolve to existing records (created earlier in a
  // categories/brands import, or already present).
  const catSlug = resolveCategory(data.category || "", ctx);
  if (data.category && !catSlug) {
    issues.push(
      err(
        rowNo,
        `Категория «${data.category}» не найдена — импортируйте категории первыми`,
        "category"
      )
    );
  }
  const brandSlug = resolveBrand(data.brand || "", ctx);
  if (data.brand && !brandSlug) {
    issues.push(
      err(
        rowNo,
        `Производитель «${data.brand}» не найден — импортируйте производителей первыми`,
        "brand"
      )
    );
  }

  const price = parseNumber(data.price || "");
  if (data.price && price === null)
    issues.push(warn(rowNo, "Цена не число — будет пропущена", "price"));
  if (price !== null && price < 0)
    issues.push(err(rowNo, "Цена не может быть отрицательной", "price"));

  const stock = parseNumber(data.stock || "");
  if (data.stock && stock === null)
    issues.push(warn(rowNo, "Остаток не число — будет пропущен", "stock"));

  const popularity = parseNumber(data.popularity || "");

  const badge = (data.badge || "").trim().toUpperCase();
  if (badge && !BADGES.has(badge)) {
    issues.push(
      warn(rowNo, `Бейдж «${data.badge}» неизвестен (HIT/NEW/IN_STOCK) — будет пуст`, "badge")
    );
  }

  const slug = (data.slug || "").trim() || (sku ? slugify(sku) : "");
  if (slug && !SLUG_RE.test(slug)) {
    issues.push(warn(rowNo, "Slug приведён к корректному виду", "slug"));
  }

  const imageUrls = (data.imageUrl || "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  for (const u of imageUrls) {
    if (!/^https?:\/\//i.test(u)) {
      issues.push(warn(rowNo, `Фото «${u}» — не URL (http/https), будет пропущено`, "imageUrl"));
    }
  }

  // Bulk attribute values via "attr:<key>" columns (see /admin/attributes).
  // Resolved case-insensitively; unrecognized keys or bad numbers are
  // warnings only — they never block the product row itself.
  for (const [col, raw] of Object.entries(data)) {
    if (!col.startsWith("attr:") || !raw.trim()) continue;
    const rawKey = col.slice("attr:".length);
    const def = ctx.attributesByLowerKey.get(rawKey.toLowerCase());
    if (!def) {
      issues.push(
        warn(rowNo, `Характеристика «${rawKey}» не найдена — добавьте в /admin/attributes`, col)
      );
    } else if (def.type === "NUMBER" && parseNumber(raw) === null) {
      issues.push(warn(rowNo, `«${def.key}»: значение «${raw}» не число — будет пропущено`, col));
    }
  }

  const exists = ctx.productSkus.has(sku);
  const action: RowAction = issues.some((i) => i.level === "error")
    ? "skip"
    : exists
      ? "update"
      : "create";

  return {
    row: rowNo,
    action,
    data: {
      ...data,
      slug: slug ? slugify(slug) : "",
      categorySlug: catSlug ?? "",
      brandSlug: brandSlug ?? "",
      price: price,
      stock: stock,
      popularity: popularity ?? 0,
      badge: badge && BADGES.has(badge) ? badge : "",
      published: data.published ? parseBool(data.published) : true,
      imageUrls: imageUrls.filter((u) => /^https?:\/\//i.test(u)),
    },
    issues,
    summary: summarize(action, `${data.title || sku}${exists ? "" : ""}`),
  };
}

function validatePrice(
  data: Record<string, string>,
  rowNo: number,
  ctx: ImportContext
): PreparedRow {
  const issues = checkRequired("prices", data, rowNo);
  const sku = (data.sku || "").trim();
  if (sku && !ctx.productSkus.has(sku)) {
    issues.push(err(rowNo, `Товар с артикулом «${sku}» не найден`, "sku"));
  }
  const price = parseNumber(data.price || "");
  if (data.price !== "" && price === null) {
    issues.push(err(rowNo, "Цена должна быть числом (или пусто = по запросу)", "price"));
  }
  if (price !== null && price < 0)
    issues.push(err(rowNo, "Цена не может быть отрицательной", "price"));

  const kind = (data.kind || "BASE").trim().toUpperCase();
  if (data.kind && !PRICE_KINDS.has(kind)) {
    issues.push(warn(rowNo, `Тип «${data.kind}» неизвестен — будет BASE`, "kind"));
  }
  const minQty = parseNumber(data.minQty || "") ?? 1;

  const action: RowAction = issues.some((i) => i.level === "error") ? "skip" : "update";
  return {
    row: rowNo,
    action,
    data: { sku, price, kind: PRICE_KINDS.has(kind) ? kind : "BASE", minQty },
    issues,
    summary: summarize(action, `${sku} → ${price === null ? "по запросу" : price + " ₸"}`),
  };
}

function validateStock(
  data: Record<string, string>,
  rowNo: number,
  ctx: ImportContext
): PreparedRow {
  const issues = checkRequired("stock", data, rowNo);
  const sku = (data.sku || "").trim();
  if (sku && !ctx.productSkus.has(sku)) {
    issues.push(err(rowNo, `Товар с артикулом «${sku}» не найден`, "sku"));
  }
  const whRaw = (data.warehouse || "").trim();
  let whCode: string | null = null;
  if (ctx.warehouseCodes.has(whRaw)) whCode = whRaw;
  else whCode = ctx.warehouseNameToCode.get(whRaw.toLowerCase()) ?? null;
  if (whRaw && !whCode) {
    issues.push(err(rowNo, `Склад «${whRaw}» не найден (код или название)`, "warehouse"));
  }
  const quantity = parseNumber(data.quantity || "");
  if (quantity === null) issues.push(err(rowNo, "Количество должно быть числом", "quantity"));
  else if (quantity < 0)
    issues.push(err(rowNo, "Количество не может быть отрицательным", "quantity"));

  const action: RowAction = issues.some((i) => i.level === "error") ? "skip" : "update";
  return {
    row: rowNo,
    action,
    data: { sku, warehouseCode: whCode ?? "", quantity: quantity ?? 0 },
    issues,
    summary: summarize(action, `${sku} @ ${whCode ?? whRaw}: ${quantity ?? "?"}`),
  };
}

const VALIDATORS: Record<
  ImportKind,
  (data: Record<string, string>, rowNo: number, ctx: ImportContext) => PreparedRow
> = {
  categories: validateCategory,
  brands: validateBrand,
  products: validateProduct,
  prices: validatePrice,
  stock: validateStock,
};

/**
 * Validate all parsed rows against the reference context, updating the context
 * as new categories/brands/products are "created" so later rows in the same
 * file can reference them.
 */
export function buildPreview(
  kind: ImportKind,
  rows: Record<string, string>[],
  sourceColumns: string[],
  fileName: string,
  ctx: ImportContext
): ImportPreview {
  const prepared: PreparedRow[] = [];
  const seenKeys = new Set<string>();

  rows.forEach((data, i) => {
    const rowNo = i + 2; // +1 header, +1 to 1-based
    const p = VALIDATORS[kind](data, rowNo, ctx);

    // Duplicate key detection within the file.
    const key =
      kind === "products" || kind === "prices" || kind === "stock"
        ? String(data.sku || "").trim()
        : String(data.slug || "").trim();
    const dupKey =
      kind === "stock" ? `${key}|${(p.data as Record<string, unknown>).warehouseCode}` : key;
    if (key) {
      if (seenKeys.has(dupKey)) {
        p.issues.push(warn(rowNo, "Повтор ключа в файле — применится последняя строка"));
      }
      seenKeys.add(dupKey);
    }

    // Optimistically extend context so subsequent rows resolve new records.
    if (p.action === "create") {
      if (kind === "categories") {
        ctx.categorySlugs.add(String(data.slug));
        if (data.title) ctx.categoryTitleToSlug.set(data.title.toLowerCase(), String(data.slug));
      } else if (kind === "brands") {
        ctx.brandSlugs.add(String(data.slug));
        if (data.name) ctx.brandNameToSlug.set(data.name.toLowerCase(), String(data.slug));
      } else if (kind === "products") {
        if (data.sku) ctx.productSkus.add(data.sku.trim());
      }
    }

    prepared.push(p);
  });

  const counts = {
    create: prepared.filter((p) => p.action === "create").length,
    update: prepared.filter((p) => p.action === "update").length,
    skip: prepared.filter((p) => p.action === "skip").length,
    errors: prepared.reduce((n, p) => n + p.issues.filter((i) => i.level === "error").length, 0),
    warnings: prepared.reduce(
      (n, p) => n + p.issues.filter((i) => i.level === "warning").length,
      0
    ),
  };

  return {
    kind,
    fileName,
    columns: sourceColumns,
    totalRows: rows.length,
    rows: prepared,
    counts,
  };
}
