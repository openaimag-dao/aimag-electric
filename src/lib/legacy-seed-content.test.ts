import { describe, expect, it } from "vitest";
import {
  isLegacySeedDescription,
  isLegacySeedDocument,
  isLegacySeedReview,
} from "@/lib/legacy-seed-content";

describe("legacy catalog demo content", () => {
  it("recognizes the three published sample reviews without hiding an edited customer review", () => {
    const review = {
      author: "Асхат Н.",
      company: "ТОО «ЭнергоМонтаж»",
      rating: 5,
      text: "Брали на объект партию — пришло в срок, вся документация в порядке. КП подготовили действительно быстро.",
    };
    expect(isLegacySeedReview(review)).toBe(true);
    expect(isLegacySeedReview({ ...review, text: "Получили заказ, спасибо." })).toBe(false);
  });

  it("recognizes generated document URLs only for the matching SKU", () => {
    expect(isLegacySeedDocument("/docs/kab-1010-certificate.pdf", "KAB-1010")).toBe(true);
    expect(isLegacySeedDocument("/docs/kab-1010-certificate.pdf", "KAB-1011")).toBe(false);
    expect(isLegacySeedDocument("/uploads/real-certificate.pdf", "KAB-1010")).toBe(false);
  });

  it("preserves a real edited description", () => {
    const title = "Кабель ВВГ";
    const brand = "Завод";
    const generated = [
      `${title} — продукция ${brand} для профессионального применения в энергетике, строительстве и промышленности. Поставляется с полным пакетом документов для юридических лиц и участия в тендерных закупках.`,
      "Изделие соответствует требованиям ГОСТ и технических регламентов Таможенного союза. Каждая партия сопровождается сертификатом соответствия и техническим паспортом.",
      "AIMAG ELECTRIC обеспечивает подбор аналогов, расчёт под проект и доставку по всему Казахстану.",
    ].join("\n\n");
    expect(isLegacySeedDescription(generated, title, brand)).toBe(true);
    expect(isLegacySeedDescription("Реальная спецификация от производителя.", title, brand)).toBe(
      false
    );
  });
});
