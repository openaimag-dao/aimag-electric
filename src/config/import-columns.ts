import type { ColumnSpec, ImportKind } from "@/types/import";

/**
 * Canonical column schema per import kind. `aliases` let us match user headers
 * in Russian or English, case/spacing-insensitive (normalized in the parser).
 */
export const IMPORT_COLUMNS: Record<ImportKind, ColumnSpec[]> = {
  categories: [
    { key: "slug", label: "Slug", required: true, hint: "латиница-с-дефисом", aliases: ["slug", "слаг", "url"] },
    { key: "title", label: "Название", required: true, aliases: ["title", "название", "наименование", "имя"] },
    { key: "description", label: "Описание", required: false, aliases: ["description", "описание"] },
    { key: "spec", label: "Тех. метка", required: false, aliases: ["spec", "метка", "тег"] },
    { key: "icon", label: "Иконка", required: false, aliases: ["icon", "иконка"] },
    { key: "order", label: "Порядок", required: false, aliases: ["order", "порядок", "сортировка"] },
  ],
  brands: [
    { key: "slug", label: "Slug", required: true, hint: "латиница-с-дефисом", aliases: ["slug", "слаг"] },
    { key: "name", label: "Название", required: true, aliases: ["name", "название", "наименование", "бренд", "производитель"] },
    { key: "origin", label: "Происхождение", required: false, aliases: ["origin", "происхождение", "страна", "город"] },
  ],
  products: [
    { key: "sku", label: "Артикул", required: true, aliases: ["sku", "артикул", "код"] },
    { key: "title", label: "Название", required: true, aliases: ["title", "название", "наименование"] },
    { key: "slug", label: "Slug", required: false, hint: "если пусто — из артикула", aliases: ["slug", "слаг"] },
    { key: "category", label: "Категория", required: true, hint: "slug или название", aliases: ["category", "категория", "раздел"] },
    { key: "brand", label: "Производитель", required: true, hint: "slug или название", aliases: ["brand", "производитель", "бренд", "манифактурер"] },
    { key: "unit", label: "Единица", required: false, hint: "шт / м / компл", aliases: ["unit", "единица", "ед", "ед.изм"] },
    { key: "price", label: "Цена, ₸", required: false, hint: "базовая цена", aliases: ["price", "цена", "стоимость"] },
    { key: "stock", label: "Остаток", required: false, hint: "кол-во на осн. складе", aliases: ["stock", "остаток", "количество", "кол-во", "склад"] },
    { key: "description", label: "Описание", required: false, aliases: ["description", "описание"] },
    { key: "badge", label: "Бейдж", required: false, hint: "HIT / NEW / IN_STOCK", aliases: ["badge", "бейдж", "метка"] },
    { key: "popularity", label: "Популярность", required: false, aliases: ["popularity", "популярность", "рейтинг"] },
    { key: "warranty", label: "Гарантия", required: false, aliases: ["warranty", "гарантия"] },
    { key: "leadTime", label: "Срок поставки", required: false, aliases: ["leadtime", "срок", "срокпоставки"] },
    { key: "imageUrl", label: "Фото (URL)", required: false, hint: "через запятую", aliases: ["imageurl", "image", "фото", "изображение", "картинка", "photo", "url"] },
    { key: "published", label: "Опубликован", required: false, hint: "да/нет, 1/0", aliases: ["published", "опубликован", "активен", "видимость"] },
  ],
  prices: [
    { key: "sku", label: "Артикул", required: true, aliases: ["sku", "артикул", "код"] },
    { key: "price", label: "Цена, ₸", required: true, hint: "пусто = по запросу", aliases: ["price", "цена", "стоимость"] },
    { key: "kind", label: "Тип", required: false, hint: "BASE / WHOLESALE / PROMO", aliases: ["kind", "тип", "видцены"] },
    { key: "minQty", label: "От кол-ва", required: false, aliases: ["minqty", "откол-ва", "минимум", "объём"] },
  ],
  stock: [
    { key: "sku", label: "Артикул", required: true, aliases: ["sku", "артикул", "код"] },
    { key: "warehouse", label: "Склад", required: true, hint: "код или название", aliases: ["warehouse", "склад", "код склада"] },
    { key: "quantity", label: "Количество", required: true, aliases: ["quantity", "количество", "кол-во", "остаток"] },
  ],
};

export function importTemplate(kind: ImportKind): { headers: string[]; example: (string | number)[] } {
  const cols = IMPORT_COLUMNS[kind];
  const headers = cols.map((c) => c.label);
  const example = cols.map((c) => {
    switch (c.key) {
      case "slug": return "kabel-vvg-3x2-5";
      case "sku": return "VVG-3x2.5";
      case "title": return "Кабель ВВГ 3×2,5";
      case "name": return "Казэнергокабель";
      case "category": return "kabeli";
      case "brand": return "kazenergokabel";
      case "unit": return "м";
      case "price": return 420;
      case "stock": return 1500;
      case "quantity": return 1500;
      case "warehouse": return "SHY";
      case "kind": return "BASE";
      case "minQty": return 1;
      case "order": return 1;
      case "badge": return "HIT";
      case "popularity": return 90;
      case "published": return "да";
      case "imageUrl": return "https://example.com/vvg.jpg";
      case "origin": return "Астана";
      case "description": return "Силовой кабель для стационарной прокладки";
      default: return "";
    }
  });
  return { headers, example };
}
