/**
 * Catalog-quality CLI report: runs validateCableProduct (deterministic
 * GOST marking rules — see src/lib/validation/cable-rules.ts) plus basic
 * completeness checks (no photo / no factory SKU / no description) across
 * the catalog, and prints a plain-text summary.
 *
 * Data source:
 *  - If DATABASE_URL is set, queries the real Product table (this is the
 *    one that matters — it's what's actually live on aimag.kz).
 *  - Otherwise falls back to src/config/catalog-data.ts, the ~43-item demo
 *    dataset that ships in this repo, so the report is still runnable (and
 *    testable) with no DB access — as in this sandbox.
 *
 * Run: `npx tsx scripts/cable-rules-report.ts`
 */
import { validateCableProduct, type ProductForValidation } from "../src/lib/validation/cable-rules";

interface ReportRow {
  sku: string;
  slug: string;
  title: string;
  hasPhoto: boolean;
  hasFactorySku: boolean;
  hasDescription: boolean;
}

/** A generated placeholder SKU looks like "KAB-1001" — real factory article numbers don't follow this pattern. */
const GENERATED_SKU_PATTERN = /^[A-Z]{3}-\d{4}$/;

async function loadFromDb(): Promise<{ rules: ProductForValidation[]; rows: ReportRow[] }> {
  // Imported lazily so this script still runs with zero Prisma setup when
  // DATABASE_URL isn't set (see loadFromCatalogData fallback below).
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const products = await prisma.product.findMany({
      select: {
        sku: true,
        slug: true,
        title: true,
        description: true,
        images: { select: { url: true } },
        values: {
          select: {
            valueString: true,
            valueNumber: true,
            attribute: { select: { key: true } },
          },
        },
      },
    });

    const rules: ProductForValidation[] = [];
    const rows: ReportRow[] = [];
    for (const p of products) {
      const material = p.values.find((v) => v.attribute.key === "material")?.valueString ?? null;
      const voltage = p.values.find((v) => v.attribute.key === "voltage")?.valueNumber ?? null;
      rules.push({ title: p.title, material, voltage });
      rows.push({
        sku: p.sku,
        slug: p.slug,
        title: p.title,
        hasPhoto: p.images.some((i) => i.url),
        hasFactorySku: !GENERATED_SKU_PATTERN.test(p.sku),
        hasDescription: Boolean(p.description?.trim()),
      });
    }
    return { rules, rows };
  } finally {
    await prisma.$disconnect();
  }
}

async function loadFromCatalogData(): Promise<{
  rules: ProductForValidation[];
  rows: ReportRow[];
}> {
  const { catalogProducts } = await import("../src/config/catalog-data");
  const rules: ProductForValidation[] = catalogProducts.map((p) => ({
    title: p.title,
    material: p.material,
    voltage: p.voltage,
  }));
  const rows: ReportRow[] = catalogProducts.map((p) => ({
    sku: p.sku,
    slug: p.slug,
    title: p.title,
    hasPhoto: false, // seed products never carry image URLs — see prisma/seed.ts
    hasFactorySku: !GENERATED_SKU_PATTERN.test(p.sku),
    hasDescription: false, // seed generates specs, not free-text descriptions
  }));
  return { rules, rows };
}

async function main() {
  const usingDb = Boolean(process.env.DATABASE_URL);
  console.log(
    usingDb
      ? "Источник: реальная БД (DATABASE_URL задан).\n"
      : "Источник: демо-набор src/config/catalog-data.ts (DATABASE_URL не задан — фото/описание в демо-товарах всегда пустые, см. prisma/seed.ts).\n"
  );

  const { rules, rows } = usingDb ? await loadFromDb() : await loadFromCatalogData();

  console.log(`Всего товаров проверено: ${rules.length}\n`);

  console.log("=== Нарушения марка↔материал/класс напряжения (ГОСТ) ===");
  let violationCount = 0;
  rules.forEach((p, i) => {
    const violations = validateCableProduct(p);
    if (violations.length === 0) return;
    violationCount += violations.length;
    const sku = rows[i]?.sku ?? "?";
    for (const v of violations) {
      console.log(
        `[${sku}] «${p.title}»: ${v.rule} — ${v.field === "material" ? "материал" : "класс напряжения"} = "${v.actual}", должно быть "${v.expected}". ${v.note}`
      );
    }
  });
  if (violationCount === 0) console.log("Нарушений не найдено.");

  const noPhoto = rows.filter((r) => !r.hasPhoto);
  const noFactorySku = rows.filter((r) => !r.hasFactorySku);
  const noDescription = rows.filter((r) => !r.hasDescription);

  console.log(`\n=== Без фото (${noPhoto.length}) ===`);
  noPhoto.forEach((r) => console.log(`[${r.sku}] ${r.title} (/catalog/${r.slug})`));

  console.log(
    `\n=== Без заводского артикула (сгенерированный SKU вида ABC-1234) (${noFactorySku.length}) ===`
  );
  noFactorySku.forEach((r) => console.log(`[${r.sku}] ${r.title} (/catalog/${r.slug})`));

  console.log(`\n=== Без описания (${noDescription.length}) ===`);
  noDescription.forEach((r) => console.log(`[${r.sku}] ${r.title} (/catalog/${r.slug})`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
