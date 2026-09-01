import { describe, it, expect } from "vitest";
import { matchRow, normalize } from "./matcher";
import type { MatchableProduct } from "./matcher";

const cable: MatchableProduct = {
  id: "p1",
  sku: "VBBSHV-4X120",
  title: "Кабель ВБбШв 4х120",
  manufacturer: "Казэнергокабель",
};
const other: MatchableProduct = {
  id: "p2",
  sku: "AVVG-3X2.5",
  title: "Провод АВВГ 3х2,5",
  manufacturer: "Кабельный завод",
};

describe("spec-import matcher", () => {
  it("normalizes cyrillic/latin x and * separators the same way", () => {
    expect(normalize("ВБбШв 4х120")).toBe(normalize("ВБбШв 4x120"));
    expect(normalize("ВБбШв 4х120")).toBe(normalize("вббшв 4*120"));
  });

  it("classifies an exact SKU match regardless of title wording", () => {
    const result = matchRow(
      { sku: "vbbshv-4x120", title: "какой-то другой текст", manufacturer: "" },
      [cable, other]
    );
    expect(result.tier).toBe("exact");
    expect(result.candidates[0].product.id).toBe("p1");
    expect(result.candidates[0].matchedFields).toContain("Артикул");
  });

  it("classifies a close title match without SKU as possible", () => {
    const result = matchRow({ sku: "", title: "Кабель ВБбШв 4x120", manufacturer: "" }, [
      cable,
      other,
    ]);
    expect(result.tier).toBe("exact");
  });

  it("classifies an unrelated row as not_found with no candidates", () => {
    const result = matchRow(
      { sku: "", title: "Автоматический выключатель 63А", manufacturer: "" },
      [cable, other]
    );
    expect(result.tier).toBe("not_found");
    expect(result.candidates).toHaveLength(0);
  });

  it("flags a mismatch between the file's embedded cable size and the matched product's real attrs", () => {
    const sized: MatchableProduct = { ...cable, cores: 4, crossSection: 95 };
    const result = matchRow({ sku: "", title: "Кабель ВБбШв 4х120", manufacturer: "" }, [
      sized,
      other,
    ]);
    expect(result.candidates[0].technicalWarning).toBe(
      "В файле: 4×120 мм², у товара: 4×95 мм² — сверьте сечение"
    );
  });

  it("stays silent when the file has no embedded size or the product has no structured attrs", () => {
    const result = matchRow(
      { sku: "vbbshv-4x120", title: "какой-то другой текст", manufacturer: "" },
      [cable, other]
    );
    expect(result.candidates[0].technicalWarning).toBeNull();
  });

  it("does not flag a mismatch when the embedded size matches the product's real attrs", () => {
    const sized: MatchableProduct = { ...cable, cores: 4, crossSection: 120 };
    const result = matchRow({ sku: "", title: "Кабель ВБбШв 4x120", manufacturer: "" }, [
      sized,
      other,
    ]);
    expect(result.candidates[0].technicalWarning).toBeNull();
  });

  it("flags a mismatch between the file's voltage column and the matched product's real attrs", () => {
    const rated: MatchableProduct = { ...cable, voltage: 10 };
    const result = matchRow(
      { sku: "vbbshv-4x120", title: "какой-то другой текст", manufacturer: "", voltage: 6 },
      [rated, other]
    );
    expect(result.candidates[0].technicalWarning).toBe(
      "В файле: 6 кВ, у товара: 10 кВ — сверьте напряжение"
    );
  });

  it("does not flag a voltage mismatch when the file has no voltage column value", () => {
    const rated: MatchableProduct = { ...cable, voltage: 10 };
    const result = matchRow(
      { sku: "vbbshv-4x120", title: "какой-то другой текст", manufacturer: "" },
      [rated, other]
    );
    expect(result.candidates[0].technicalWarning).toBeNull();
  });

  it("combines a dimension warning and a voltage warning when both mismatch", () => {
    const rated: MatchableProduct = { ...cable, cores: 4, crossSection: 95, voltage: 10 };
    const result = matchRow(
      { sku: "", title: "Кабель ВБбШв 4х120", manufacturer: "", voltage: 6 },
      [rated, other]
    );
    expect(result.candidates[0].technicalWarning).toBe(
      "В файле: 4×120 мм², у товара: 4×95 мм² — сверьте сечение · В файле: 6 кВ, у товара: 10 кВ — сверьте напряжение"
    );
  });

  it("flags a mismatch between the file's cross-section column and the matched product's real attrs, for a title with no embedded size", () => {
    const clamp: MatchableProduct = {
      id: "p3",
      sku: "ZAB-16",
      title: "Зажим анкерный ЗАБ 16",
      manufacturer: "",
      crossSection: 16,
    };
    const result = matchRow(
      { sku: "", title: "Зажим анкерный ЗАБ 16", manufacturer: "", crossSection: 25 },
      [clamp, other]
    );
    expect(result.candidates[0].technicalWarning).toBe(
      "В файле: 25 мм², у товара: 16 мм² — сверьте сечение"
    );
  });

  it("does not flag a cross-section mismatch when the file has no cross-section column value", () => {
    const clamp: MatchableProduct = {
      id: "p3",
      sku: "ZAB-16",
      title: "Зажим анкерный ЗАБ 16",
      manufacturer: "",
      crossSection: 16,
    };
    const result = matchRow({ sku: "", title: "Зажим анкерный ЗАБ 16", manufacturer: "" }, [
      clamp,
      other,
    ]);
    expect(result.candidates[0].technicalWarning).toBeNull();
  });

  it("prefers the title-embedded size over the cross-section column, so cable rows never get a duplicate warning", () => {
    const sized: MatchableProduct = { ...cable, cores: 4, crossSection: 95 };
    const result = matchRow(
      { sku: "", title: "Кабель ВБбШв 4х120", manufacturer: "", crossSection: 999 },
      [sized, other]
    );
    expect(result.candidates[0].technicalWarning).toBe(
      "В файле: 4×120 мм², у товара: 4×95 мм² — сверьте сечение"
    );
  });

  it("never returns more than 3 candidates", () => {
    const many: MatchableProduct[] = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`,
      sku: `SKU-${i}`,
      title: "Кабель ВБбШв 4х120",
      manufacturer: "",
    }));
    const result = matchRow({ sku: "", title: "Кабель ВБбШв 4х120", manufacturer: "" }, many);
    expect(result.candidates.length).toBeLessThanOrEqual(3);
  });
});
