import { describe, expect, it } from "vitest";
import { productSpecRows } from "@/lib/product-specs";

describe("product detail specifications", () => {
  it("shows custom attributes in configured order with their own units, preserving zero and false", () => {
    const values = [
      {
        attribute: { key: "current", name: "Номинальный ток", unit: "А", order: 2 },
        valueNumber: 0,
        valueBool: null,
        valueString: null,
      },
      {
        attribute: { key: "outdoor", name: "Наружная установка", unit: null, order: 3 },
        valueNumber: null,
        valueBool: false,
        valueString: null,
      },
      {
        attribute: { key: "protection", name: "Степень защиты", unit: null, order: 1 },
        valueNumber: null,
        valueBool: null,
        valueString: " IP54 ",
      },
    ];
    expect(productSpecRows(values)).toEqual([
      { label: "Степень защиты", value: "IP54" },
      { label: "Номинальный ток", value: "0 А" },
      { label: "Наружная установка", value: "Нет" },
    ]);
    expect(values[0].attribute.key).toBe("current");
  });

  it("omits missing and whitespace-only values without guessing specifications", () => {
    const attribute = { key: "size", name: "Размер", unit: "мм", order: 1 };
    expect(
      productSpecRows([
        { attribute, valueNumber: null, valueBool: null, valueString: null },
        { attribute, valueNumber: null, valueBool: null, valueString: " \n " },
      ])
    ).toEqual([]);
  });
});
