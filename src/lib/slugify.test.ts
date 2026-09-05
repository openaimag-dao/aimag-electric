import { describe, it, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("transliterates Cyrillic to Latin", () => {
    expect(slugify("Кабель ВВГнг")).toBe("kabel-vvgng");
  });
  it("lowercases and collapses non-alphanumeric runs into single hyphens", () => {
    expect(slugify("Провод СИП-2 1×1.5")).toBe("provod-sip-2-1-1-5");
  });
  it("trims leading/trailing hyphens", () => {
    expect(slugify("  Автомат ВА47-29  ")).toBe("avtomat-va47-29");
  });
  it("caps length at 60 characters", () => {
    const long = "Кабель ВВГнг(А)-LS очень длинное название товара для теста";
    expect(slugify(long).length).toBeLessThanOrEqual(60);
  });
});
