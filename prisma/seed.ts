/**
 * Seed — migrates the deterministic catalog snapshot into Postgres.
 * Idempotent: uses upserts so re-running won't duplicate reference data, and
 * clears product-scoped rows before reinserting the product graph.
 *
 * Run: `npm run db:seed` (after `prisma migrate deploy`).
 */
import {
  PrismaClient,
  AttributeType,
  DocumentKind,
  PriceKind,
  ProductBadge,
  Prisma,
} from "@prisma/client";

import { catalogProducts } from "../src/config/catalog-data";
import { manufacturers } from "../src/config/manufacturers";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// --- Reference: categories (with icon names for the DB) --------------------

const categoryDefs = [
  {
    slug: "kabeli",
    title: "Кабели",
    spec: "0,66–35 кВ",
    icon: "Cable",
    description:
      "Силовые, контрольные и бронированные кабели ВВГ, АВВГ, ВБбШв, КГ и специальные марки.",
  },
  {
    slug: "provoda",
    title: "Провода",
    spec: "Cu / Al",
    icon: "Zap",
    description: "Установочные и монтажные провода ПВ, ПуГВ, ПВС, СИП для распределительных сетей.",
  },
  {
    slug: "izolyatory",
    title: "Изоляторы",
    spec: "Фарфор / стекло",
    icon: "Shield",
    description: "Штыревые, подвесные, опорные и проходные изоляторы для ВЛ и распредустройств.",
  },
  {
    slug: "armatura-sip",
    title: "Арматура СИП",
    spec: "0,4 кВ ВЛИ",
    icon: "Link2",
    description: "Анкерные, поддерживающие и соединительные зажимы, прокалывающие ответвители.",
  },
  {
    slug: "mufty",
    title: "Муфты",
    spec: "1–35 кВ",
    icon: "Combine",
    description: "Термоусаживаемые и холодной усадки муфты — соединительные и концевые.",
  },
  {
    slug: "avtomaty",
    title: "Автоматы",
    spec: "6–630 А",
    icon: "ToggleRight",
    description: "Модульные автоматические выключатели, УЗО, дифавтоматы и щитовое оборудование.",
  },
  {
    slug: "vysokovoltnoe",
    title: "Высоковольтное оборудование",
    spec: "до 110 кВ",
    icon: "Factory",
    description: "Разъединители, выключатели нагрузки, трансформаторы и КРУ для подстанций.",
  },
];

const attributeDefs = [
  { key: "material", name: "Материал", type: AttributeType.STRING, unit: null, order: 1 },
  { key: "cores", name: "Количество жил", type: AttributeType.NUMBER, unit: null, order: 2 },
  { key: "crossSection", name: "Сечение", type: AttributeType.NUMBER, unit: "мм²", order: 3 },
  { key: "voltage", name: "Напряжение", type: AttributeType.NUMBER, unit: "кВ", order: 4 },
];

const warehouseDefs = [
  { code: "SHY", name: "Центральный склад", city: "Шымкент" },
  { code: "ALA", name: "Склад Алматы", city: "Алматы" },
  { code: "AST", name: "Склад Астана", city: "Астана" },
];

function slugifyBrand(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
}

const badgeMap: Record<string, ProductBadge> = {
  Хит: ProductBadge.HIT,
  Новинка: ProductBadge.NEW,
  "Со склада": ProductBadge.IN_STOCK,
};

const reviewPool = [
  {
    author: "Асхат Н.",
    company: "ТОО «ЭнергоМонтаж»",
    rating: 5,
    text: "Брали на объект партию — пришло в срок, вся документация в порядке. КП подготовили действительно быстро.",
  },
  {
    author: "Марат С.",
    company: "СМУ-7",
    rating: 5,
    text: "Соответствует ГОСТ, маркировка читаемая, сечение по факту совпадает с паспортом. Возьмём ещё.",
  },
  {
    author: "Ирина В.",
    company: "Отдел снабжения",
    rating: 4,
    text: "Хорошая цена по опту. Отгрузку хотелось бы чуть быстрее, но в целом всё чётко.",
  },
];

async function main() {
  console.log("Seeding AIMAG ELECTRIC…");

  // Categories
  const categoryBySlug = new Map<string, string>();
  for (const [i, c] of categoryDefs.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { title: c.title, spec: c.spec, icon: c.icon, description: c.description, order: i },
      create: { ...c, order: i },
    });
    categoryBySlug.set(c.slug, row.id);
  }

  // Brands (from manufacturers + any brand referenced by products)
  const brandNames = new Set<string>(manufacturers.map((m) => m.name));
  catalogProducts.forEach((p) => brandNames.add(p.manufacturer));
  const originByName = new Map(manufacturers.map((m) => [m.name, m.origin]));

  const brandByName = new Map<string, string>();
  for (const name of brandNames) {
    const slug = slugifyBrand(name);
    const row = await prisma.brand.upsert({
      where: { slug },
      update: { name, origin: originByName.get(name) ?? null },
      create: { slug, name, origin: originByName.get(name) ?? null },
    });
    brandByName.set(name, row.id);
  }

  // Attributes
  const attrByKey = new Map<string, string>();
  for (const a of attributeDefs) {
    const row = await prisma.attribute.upsert({
      where: { key: a.key },
      update: { name: a.name, type: a.type, unit: a.unit, order: a.order },
      create: a,
    });
    attrByKey.set(a.key, row.id);
  }

  // Warehouses
  const warehouses: { id: string; code: string }[] = [];
  for (const w of warehouseDefs) {
    const row = await prisma.warehouse.upsert({
      where: { code: w.code },
      update: { name: w.name, city: w.city },
      create: w,
    });
    warehouses.push({ id: row.id, code: row.code });
  }

  // Clean product-scoped data for a deterministic reseed
  await prisma.attributeValue.deleteMany();
  await prisma.productDocument.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.price.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();

  const galleryByCat: Record<string, number> = {
    kabeli: 4,
    provoda: 4,
    izolyatory: 3,
    "armatura-sip": 3,
    mufty: 3,
    avtomaty: 4,
    vysokovoltnoe: 5,
  };

  // Products + graph
  for (const p of catalogProducts) {
    const categoryId = categoryBySlug.get(p.categorySlug)!;
    const brandId = brandByName.get(p.manufacturer)!;

    const description = [
      `${p.title} — продукция ${p.manufacturer} для профессионального применения в энергетике, строительстве и промышленности. Поставляется с полным пакетом документов для юридических лиц и участия в тендерных закупках.`,
      `Изделие соответствует требованиям ГОСТ и технических регламентов Таможенного союза. Каждая партия сопровождается сертификатом соответствия и техническим паспортом.`,
      `AIMAG ELECTRIC обеспечивает подбор аналогов, расчёт под проект и доставку по всему Казахстану.`,
    ].join("\n\n");

    // Attribute values
    const values: Prisma.AttributeValueCreateWithoutProductInput[] = [];
    if (p.material)
      values.push({
        attribute: { connect: { id: attrByKey.get("material")! } },
        valueString: p.material,
      });
    if (p.cores !== null)
      values.push({
        attribute: { connect: { id: attrByKey.get("cores")! } },
        valueNumber: p.cores,
      });
    if (p.crossSection !== null)
      values.push({
        attribute: { connect: { id: attrByKey.get("crossSection")! } },
        valueNumber: p.crossSection,
      });
    if (p.voltage !== null)
      values.push({
        attribute: { connect: { id: attrByKey.get("voltage")! } },
        valueNumber: p.voltage,
      });

    // Documents
    const skuLower = p.sku.toLowerCase();
    const documents: Prisma.ProductDocumentCreateWithoutProductInput[] = [
      {
        title: `Технический паспорт — ${p.title}`,
        kind: DocumentKind.DATASHEET,
        url: `/docs/${skuLower}-datasheet.pdf`,
        size: "1,2 МБ",
        order: 0,
      },
      {
        title: "Сертификат соответствия ТР ТС",
        kind: DocumentKind.CERTIFICATE,
        url: `/docs/${skuLower}-certificate.pdf`,
        size: "640 КБ",
        order: 1,
      },
    ];
    if (p.categorySlug === "kabeli" || p.categorySlug === "provoda")
      documents.push({
        title: "Протокол испытаний",
        kind: DocumentKind.MANUAL,
        url: `/docs/${skuLower}-test-report.pdf`,
        size: "820 КБ",
        order: 2,
      });
    if (p.categorySlug === "vysokovoltnoe" || p.categorySlug === "mufty") {
      documents.push({
        title: "Инструкция по монтажу",
        kind: DocumentKind.MANUAL,
        url: `/docs/${skuLower}-manual.pdf`,
        size: "2,1 МБ",
        order: 2,
      });
      documents.push({
        title: "Габаритный чертёж",
        kind: DocumentKind.DRAWING,
        url: `/docs/${skuLower}-drawing.pdf`,
        size: "480 КБ",
        order: 3,
      });
    }

    // Images (placeholders — url null renders category plate)
    const imageCount = galleryByCat[p.categorySlug] ?? 3;
    const images: Prisma.ProductImageCreateWithoutProductInput[] = Array.from(
      { length: imageCount },
      (_, i) => ({ url: null, alt: `${p.title} — вид ${i + 1}`, order: i })
    );

    // Reviews (deterministic subset)
    const reviewCount = (p.popularity % 3) + 1;
    const reviews: Prisma.ReviewCreateWithoutProductInput[] = reviewPool
      .slice(0, reviewCount)
      .map((r, i) => {
        const d = new Date(2025, 10, 1);
        d.setDate(d.getDate() + ((p.popularity + i * 11) % 40));
        return { ...r, createdAt: d };
      });

    const leadTime =
      p.availability === "in_stock"
        ? "1–2 рабочих дня со склада"
        : p.availability === "on_order"
          ? "7–14 рабочих дней"
          : "уточняется по запросу";

    const created = await prisma.product.create({
      data: {
        slug: p.slug,
        sku: p.sku,
        title: p.title,
        description,
        unit: p.unit,
        packaging:
          p.unit === "м"
            ? "бухта / барабан, кратно 100 м"
            : p.unit === "шт"
              ? "поштучно и упаковками"
              : null,
        warranty: "12 месяцев",
        leadTime,
        badge: p.badge ? badgeMap[p.badge] : null,
        popularity: p.popularity,
        createdAt: new Date(p.createdAt),
        category: { connect: { id: categoryId } },
        brand: { connect: { id: brandId } },
        values: { create: values },
        documents: { create: documents },
        images: { create: images },
        reviews: { create: reviews },
      },
    });

    // Stock: in_stock → qty on main WH; on_order → 0 with restock date; out → nothing
    if (p.availability === "in_stock") {
      await prisma.stock.create({
        data: {
          productId: created.id,
          warehouseId: warehouses[0].id,
          quantity: 500 + (p.popularity % 5) * 100,
        },
      });
      // spread some to a second warehouse
      if (p.popularity % 2 === 0) {
        await prisma.stock.create({
          data: { productId: created.id, warehouseId: warehouses[1].id, quantity: 120 },
        });
      }
    } else if (p.availability === "on_order") {
      const restock = new Date();
      restock.setDate(restock.getDate() + 10);
      await prisma.stock.create({
        data: {
          productId: created.id,
          warehouseId: warehouses[0].id,
          quantity: 0,
          restockAt: restock,
        },
      });
    }

    // Price: store in тиын (×100). null → skip (по запросу)
    if (p.price !== null) {
      await prisma.price.create({
        data: { productId: created.id, kind: PriceKind.BASE, amount: p.price * 100, minQty: 1 },
      });
      // wholesale tier ~7% off for 100+
      await prisma.price.create({
        data: {
          productId: created.id,
          kind: PriceKind.WHOLESALE,
          amount: Math.round(p.price * 100 * 0.93),
          minQty: 100,
        },
      });
    }
  }

  // Demo accounts for the portal (личный кабинет). Passwords are bcrypt-hashed.
  // Credentials: admin@aimag.kz / manager@aimag.kz / client@aimag.kz — all "aimag123".
  const demoHash = await hash("aimag123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@aimag.kz" },
    update: { passwordHash: demoHash, role: "ADMIN", name: "Администратор" },
    create: {
      email: "admin@aimag.kz",
      passwordHash: demoHash,
      role: "ADMIN",
      name: "Администратор",
    },
  });
  const manager = await prisma.user.upsert({
    where: { email: "manager@aimag.kz" },
    update: { passwordHash: demoHash, role: "MANAGER", name: "Асель Нурланова" },
    create: {
      email: "manager@aimag.kz",
      passwordHash: demoHash,
      role: "MANAGER",
      name: "Асель Нурланова",
    },
  });
  const client = await prisma.user.upsert({
    where: { email: "client@aimag.kz" },
    update: {
      passwordHash: demoHash,
      role: "CUSTOMER",
      name: "Данияр Ким",
      company: "КазЭнергоМонтаж",
    },
    create: {
      email: "client@aimag.kz",
      passwordHash: demoHash,
      role: "CUSTOMER",
      name: "Данияр Ким",
      company: "КазЭнергоМонтаж",
    },
  });

  // A CRM customer profile linked to the demo client + owned by the manager.
  const existingCustomer = await prisma.customer.findFirst({
    where: { company: "КазЭнергоМонтаж" },
  });
  if (!existingCustomer) {
    await prisma.customer.create({
      data: {
        company: "КазЭнергоМонтаж",
        contact: "Данияр Ким",
        email: "client@aimag.kz",
        city: "Шымкент",
        status: "ACTIVE",
        userId: client.id,
        ownerId: manager.id,
      },
    });
  }
  console.log("Users seeded:", {
    admin: admin.email,
    manager: manager.email,
    client: client.email,
  });

  const counts = {
    categories: await prisma.category.count(),
    brands: await prisma.brand.count(),
    attributes: await prisma.attribute.count(),
    warehouses: await prisma.warehouse.count(),
    products: await prisma.product.count(),
    prices: await prisma.price.count(),
    stock: await prisma.stock.count(),
    documents: await prisma.productDocument.count(),
    reviews: await prisma.review.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
