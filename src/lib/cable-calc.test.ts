import { describe, it, expect } from "vitest";
import { currentFromPower, recommendCrossSection, ampacityTable } from "./cable-calc";

describe("currentFromPower", () => {
  it("computes single-phase 220V current", () => {
    // 2.2 kW at 220V, cosφ 0.95 → ~10.5A
    expect(currentFromPower(2.2, "single")).toBeCloseTo(10.526, 2);
  });
  it("computes three-phase 380V current lower than single-phase for the same power", () => {
    const single = currentFromPower(15, "single");
    const three = currentFromPower(15, "three");
    expect(three).toBeLessThan(single);
  });
});

describe("recommendCrossSection", () => {
  it("never recommends a cross-section whose ampacity is below the load", () => {
    const { row } = recommendCrossSection(25, "copper");
    expect(row).not.toBeNull();
    expect(row!.currentA).toBeGreaterThanOrEqual(25);
  });
  it("picks the smallest sufficient size, not an oversized one", () => {
    // 27A is exactly the 2.5mm² copper rating — must not jump to 4mm².
    const { row } = recommendCrossSection(27, "copper");
    expect(row!.crossSectionMm2).toBe(2.5);
  });
  it("flags when the load exceeds the whole table", () => {
    const { exceedsTable, row } = recommendCrossSection(10_000, "copper");
    expect(exceedsTable).toBe(true);
    expect(row).toBeNull();
  });
  it("aluminum table starts at 2.5mm² and requires a larger size than copper for the same current", () => {
    const cu = recommendCrossSection(36, "copper");
    const al = recommendCrossSection(36, "aluminum");
    expect(al.row!.crossSectionMm2).toBeGreaterThanOrEqual(cu.row!.crossSectionMm2);
  });
});

describe("ampacityTable", () => {
  it("is sorted ascending by cross-section for both materials", () => {
    for (const material of ["copper", "aluminum"] as const) {
      const table = ampacityTable(material);
      for (let i = 1; i < table.length; i++) {
        expect(table[i].crossSectionMm2).toBeGreaterThan(table[i - 1].crossSectionMm2);
        expect(table[i].currentA).toBeGreaterThan(table[i - 1].currentA);
      }
    }
  });
});
