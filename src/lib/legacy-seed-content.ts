/** Signatures from the old catalog seed. Existing rows stay in the database;
 * only public presentation is filtered so real, independently added content survives. */
const demoReviews = [
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

export function isLegacySeedReview(review: {
  author: string;
  company: string | null;
  rating: number;
  text: string;
}): boolean {
  return demoReviews.some(
    (candidate) =>
      candidate.author === review.author &&
      candidate.company === review.company &&
      candidate.rating === review.rating &&
      candidate.text === review.text
  );
}

const generatedDocumentKinds = ["datasheet", "certificate", "test-report", "manual", "drawing"];

export function isLegacySeedDocument(url: string, sku: string): boolean {
  return generatedDocumentKinds.some((kind) => url === `/docs/${sku.toLowerCase()}-${kind}.pdf`);
}

/** Exact match protects real copy subsequently edited in the admin panel. */
export function isLegacySeedDescription(description: string | null, title: string, brand: string) {
  return (
    description ===
    [
      `${title} — продукция ${brand} для профессионального применения в энергетике, строительстве и промышленности. Поставляется с полным пакетом документов для юридических лиц и участия в тендерных закупках.`,
      "Изделие соответствует требованиям ГОСТ и технических регламентов Таможенного союза. Каждая партия сопровождается сертификатом соответствия и техническим паспортом.",
      "AIMAG ELECTRIC обеспечивает подбор аналогов, расчёт под проект и доставку по всему Казахстану.",
    ].join("\n\n")
  );
}

export function isLegacySeedLeadTime(value: string | null): boolean {
  return (
    value === "1–2 рабочих дня со склада" ||
    value === "7–14 рабочих дней" ||
    value === "уточняется по запросу"
  );
}

export function isLegacySeedPackaging(value: string | null, unit: string): boolean {
  return (
    (unit === "м" && value === "бухта / барабан, кратно 100 м") ||
    (unit === "шт" && value === "поштучно и упаковками")
  );
}
