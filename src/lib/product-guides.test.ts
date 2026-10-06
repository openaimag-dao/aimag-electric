import { describe, expect, it } from "vitest";
import { productGuides } from "./product-guides";

describe("product buying guides", () => {
  it.each([
    ["Провод СИП-3 1×35", "kupit-sip-3-kazakhstan"],
    ["Провод СИП-4 1×16", "kupit-sip-4-kazakhstan"],
    ["Кабель ВВГнг(А)-LS 2×1.5", "kupit-vvgng-kazakhstan"],
    ["Муфта концевая 3×25", "kupit-kabelnye-mufty-kazakhstan"],
    ["Изолятор ШС-6", "kupit-izolyatory-kazakhstan"],
    ["КТП 400 кВА", "kupit-ktp-kazakhstan"],
    ["Трансформатор ТМГ", "kupit-silovoy-transformator-kazakhstan"],
  ])("links %s to %s", (title, slug) => {
    expect(productGuides(title)[0]?.href).toBe(`/blog/${slug}`);
  });

  it("does not suggest a guide for unrelated products or other SIP grades", () => {
    expect(productGuides("Автомат ВА47-29-0.4 C16")).toEqual([]);
    expect(productGuides("СИП-2 1×25")).toEqual([]);
  });
});
