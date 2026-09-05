// One-off generator → prints TS for src/config/catalog-data.ts
// Deterministic: no Math.random, stable ordering.

// Mirrors src/lib/slugify.ts — duplicated here since this is a standalone
// .mjs codegen script with no bundler, not runtime application code.
const CYRILLIC_MAP = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};
function slugify(input) {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => (CYRILLIC_MAP[ch] !== undefined ? CYRILLIC_MAP[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const categories = [
  { slug: "kabeli", name: "Кабели", unit: "м", material: ["Медь", "Алюминий"], voltage: [0.66, 1, 6, 10], cores: [2, 3, 4, 5], cs: [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70] },
  { slug: "provoda", name: "Провода", unit: "м", material: ["Медь", "Алюминий"], voltage: [0.4, 0.66, 1], cores: [1, 2, 3, 4], cs: [1.5, 2.5, 4, 6, 16, 25, 35, 70, 95] },
  { slug: "izolyatory", name: "Изоляторы", unit: "шт", material: ["Стекло", "Фарфор"], voltage: [6, 10, 35], cores: [null], cs: [null] },
  { slug: "armatura-sip", name: "Арматура СИП", unit: "шт", material: ["Пластик", "Сталь"], voltage: [0.4], cores: [null], cs: [16, 25, 35, 70, 95] },
  { slug: "mufty", name: "Муфты", unit: "шт", material: ["Пластик"], voltage: [1, 6, 10, 35], cores: [3, 4], cs: [16, 25, 50, 70] },
  { slug: "avtomaty", name: "Автоматы", unit: "шт", material: ["Пластик"], voltage: [0.4], cores: [1, 2, 3, 4], cs: [null] },
  { slug: "vysokovoltnoe", name: "Высоковольтное оборудование", unit: "шт", material: ["Сталь"], voltage: [10, 35, 110], cores: [null], cs: [null] },
];

const brandsByCat = {
  kabeli: ["Камкабель", "Севкабель", "Сарансккабель", "KazEnergoKabel"],
  provoda: ["ЭЛСИ", "KazEnergoKabel", "Камкабель"],
  izolyatory: ["Ниcentr", "ЮМЭК"],
  "armatura-sip": ["ЭЛСИ", "Ниled", "SICAME"],
  mufty: ["Райхем", "КВТ", "3M"],
  avtomaty: ["IEK", "EKF", "КЭАЗ", "Schneider"],
  vysokovoltnoe: ["ABB", "КЭАЗ", "ЮМЭК"],
};

const titlePrefix = {
  kabeli: ["Кабель ВВГнг(А)-LS", "Кабель АВВГ", "Кабель ВБбШв", "Кабель КГ", "Кабель ПвБбШп"],
  provoda: ["Провод СИП-2", "Провод ПуГВ", "Провод ПВС", "Провод ПВ-3", "Провод СИП-4"],
  izolyatory: ["Изолятор ШС", "Изолятор ШФ", "Изолятор ПС", "Изолятор ИОС"],
  "armatura-sip": ["Зажим анкерный ЗАБ", "Зажим поддерживающий", "Ответвитель прокалывающий", "Кронштейн анкерный"],
  mufty: ["Муфта термоусаживаемая", "Муфта концевая", "Муфта соединительная", "Муфта холодной усадки"],
  avtomaty: ["Автомат ВА47-29", "Дифавтомат АД14", "УЗО ВД1-63", "Выключатель нагрузки"],
  vysokovoltnoe: ["Разъединитель РЛНД", "Выключатель нагрузки ВНА", "Трансформатор ТМГ", "Ячейка КСО"],
};

function priceFor(cat, cs, voltage) {
  if (cat === "izolyatory" || cat === "vysokovoltnoe") return null; // по запросу
  if (cat === "mufty" && voltage >= 10) return null;
  let base = 120;
  if (cs) base += cs * 14;
  if (voltage) base += voltage * 22;
  if (cat === "avtomaty") base = 1800 + (voltage || 1) * 400;
  if (cat === "armatura-sip") base = 380 + (cs || 20) * 6;
  return Math.round(base);
}

const products = [];
let counter = 0;
const badges = ["Хит", "Новинка", "Со склада", null, null];

for (const cat of categories) {
  const prefixes = titlePrefix[cat.slug];
  const brands = brandsByCat[cat.slug];
  let idxInCat = 0;
  for (const cores of cat.cores) {
    for (const cs of cat.cs) {
      // limit combinations per category to keep dataset ~ 8-14 each
      if (idxInCat >= 12) break;
      let voltage = cat.voltage[(idxInCat + (cores || 0)) % cat.voltage.length];
      let material = cat.material[idxInCat % cat.material.length];
      const brand = brands[idxInCat % brands.length];
      const prefix = prefixes[idxInCat % prefixes.length];

      // Deterministic GOST facts override the category-level cycling above
      // for markings with only one valid material/voltage class — see
      // src/lib/validation/cable-rules.ts (kept in sync with this list).
      if (prefix.includes("АВВГ")) {
        material = "Алюминий";
        if (![0.66, 1].includes(voltage)) voltage = 1;
      } else if (prefix.includes("ВВГ")) {
        material = "Медь";
        if (![0.66, 1].includes(voltage)) voltage = 1;
      } else if (prefix.includes("СИП")) {
        material = "Алюминий";
      } else if (prefix.includes("ПуГВ") || prefix.includes("ПВС") || prefix.includes("ПВ-3")) {
        material = "Медь";
      }

      let spec = "";
      if (cores && cs) spec = ` ${cores}×${cs}`;
      else if (cs) spec = ` ${cs}`;
      else spec = `-${voltage}`;
      const amperage = cat.slug === "avtomaty" ? ` C${[16, 25, 32, 40, 63][idxInCat % 5]}` : "";
      const title = `${prefix}${spec}${amperage}`.replace(/\s+/g, " ").trim();

      const availPick = [0, 0, 0, 1, 1, 2][(idxInCat + counter) % 6];
      const availability = availPick === 0 ? "in_stock" : availPick === 1 ? "on_order" : "out";

      counter++;
      idxInCat++;
      const daysAgo = (counter * 7) % 300;
      const created = new Date(2026, 0, 1);
      created.setDate(created.getDate() - daysAgo);

      const badge = badges[(counter + idxInCat) % badges.length];
      const sku = `${cat.slug.slice(0, 3).toUpperCase()}-${1000 + counter}`;
      const record = {
        id: `p${String(counter).padStart(3, "0")}`,
        slug: `${slugify(title)}-${sku.toLowerCase()}`,
        title,
        categorySlug: cat.slug,
        category: cat.name,
        manufacturer: brand,
        sku,
        price: priceFor(cat.slug, cs, voltage),
        unit: cat.unit,
        availability,
        material,
        cores: cores,
        crossSection: cs,
        voltage,
        createdAt: created.toISOString().slice(0, 10),
        popularity: ((counter * 37) % 100) + (availability === "in_stock" ? 40 : 0),
      };
      if (badge) record.badge = badge;
      products.push(record);
    }
    if (idxInCat >= 12) break;
  }
}

const header = `// AUTO-GENERATED dataset for the catalog. Deterministic snapshot.
// In production this comes from Prisma (Product model). Regenerate via scripts/gen-catalog.
import type { CatalogProduct } from "@/types/catalog";

export const catalogProducts: CatalogProduct[] = `;

console.log(header + JSON.stringify(products, null, 2) + ";\n");
console.error(`Generated ${products.length} products`);
