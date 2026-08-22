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
