import { describe, expect, it } from "vitest";
import { parseFilters, filtersToParams } from "./catalog-url";

describe("catalog numeric URL filters", () => {
  it.each(["abc", "NaN", "Infinity", "-1", "1e308", " "])(
    "ignores unsafe price bound %s",
    (value) => {
      const filters = parseFilters(new URLSearchParams({ q: "ВВГ", pmin: value, pmax: value }));
      expect(filters.priceMin).toBeNull();
      expect(filters.priceMax).toBeNull();
      expect(filters.q).toBe("ВВГ");
    }
  );
  it("preserves valid decimal and zero bounds", () => {
    const filters = parseFilters(new URLSearchParams("pmin=0&pmax=1234.5"));
    expect(filters.priceMin).toBe(0);
    expect(filters.priceMax).toBe(1234.5);
    expect(parseFilters(filtersToParams(filters))).toEqual(filters);
  });
  it("keeps valid dimensions while dropping empty, negative and nonfinite values", () => {
    const filters = parseFilters(
      new URLSearchParams("cores=3,,Infinity,-1,abc&cs=1.5,0,NaN&v=0.4,Infinity")
    );
    expect(filters.cores).toEqual([3]);
    expect(filters.crossSections).toEqual([1.5]);
    expect(filters.voltages).toEqual([0.4]);
  });
});
