import { describe, expect, it } from "vitest";

import { validateCableProduct } from "@/lib/validation/cable-rules";

describe("validateCableProduct", () => {
  it("accepts СИП with aluminum conductor", () => {
    expect(
      validateCableProduct({ title: "Провод СИП-2 3×70", material: "Алюминий", voltage: 0.4 })
    ).toEqual([]);
  });

  it("flags СИП with a copper conductor", () => {
    const v = validateCableProduct({ title: "Провод СИП-2 3×70", material: "Медь", voltage: 0.4 });
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ rule: "СИП", field: "material", actual: "Медь" });
  });

  it("accepts ПВ-3 with a copper conductor", () => {
    expect(
      validateCableProduct({ title: "Провод ПВ-3 1×25", material: "Медь", voltage: 0.66 })
    ).toEqual([]);
  });

  it("flags ПВ-3 with an aluminum conductor", () => {
    const v = validateCableProduct({
      title: "Провод ПВ-3 1×25",
      material: "Алюминий",
      voltage: 0.66,
    });
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ rule: "ПВ-3", field: "material" });
  });

  it("accepts АВВГ at 0.66/1 кВ with an aluminum conductor", () => {
    expect(
      validateCableProduct({ title: "Кабель АВВГ 4×16", material: "Алюминий", voltage: 1 })
    ).toEqual([]);
  });

  it("flags АВВГ rated at 10 кВ", () => {
    const v = validateCableProduct({
      title: "Кабель АВВГ 4×16",
      material: "Алюминий",
      voltage: 10,
    });
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ rule: "АВВГ", field: "voltage", actual: "10 кВ" });
  });

  it("flags АВВГ with a copper conductor and reports both violations", () => {
    const v = validateCableProduct({ title: "Кабель АВВГ 4×16", material: "Медь", voltage: 10 });
    expect(v).toHaveLength(2);
    expect(v.map((x) => x.field).sort()).toEqual(["material", "voltage"]);
  });

  it("does not match ВВГ's copper rule against АВВГ", () => {
    // АВВГ (aluminum) must not also trip the plain-ВВГ (copper) rule.
    const v = validateCableProduct({ title: "Кабель АВВГ 4×16", material: "Алюминий", voltage: 1 });
    expect(v.some((x) => x.rule === "ВВГ")).toBe(false);
  });

  it("accepts ВВГ (no А prefix) with a copper conductor", () => {
    expect(
      validateCableProduct({ title: "Кабель ВВГнг(А)-LS 2×1.5", material: "Медь", voltage: 0.66 })
    ).toEqual([]);
  });

  it("flags ВВГ with an aluminum conductor", () => {
    const v = validateCableProduct({
      title: "Кабель ВВГнг(А)-LS 2×1.5",
      material: "Алюминий",
      voltage: 0.66,
    });
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ rule: "ВВГ", field: "material" });
  });

  it("returns no findings for markings with no unambiguous rule", () => {
    expect(
      validateCableProduct({ title: "Изолятор ШС-10", material: "Стекло", voltage: 10 })
    ).toEqual([]);
  });

  it("skips the voltage check when voltage is null", () => {
    expect(
      validateCableProduct({ title: "Кабель АВВГ 4×16", material: "Алюминий", voltage: null })
    ).toEqual([]);
  });
});
