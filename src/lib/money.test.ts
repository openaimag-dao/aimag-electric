import { describe, it, expect } from "vitest";
import { tengeToTiyn, tiynToTenge, formatTenge, formatTiyn, formatTengePerUnit } from "./money";

describe("money", () => {
  it("converts тенге to тиын as integer", () => {
    expect(tengeToTiyn(420)).toBe(42000);
    expect(tengeToTiyn(0.5)).toBe(50);
  });
  it("rounds fractional тиын conversions", () => {
    expect(tengeToTiyn(1.239)).toBe(124);
  });
  it("converts тиын back to whole тенге", () => {
    expect(tiynToTenge(42000)).toBe(420);
    expect(tiynToTenge(42099)).toBe(421);
  });
  it("round-trips within rounding tolerance", () => {
    expect(tiynToTenge(tengeToTiyn(1500))).toBe(1500);
  });
  it("formats тенге with the currency suffix", () => {
    expect(formatTenge(1500)).toMatch(/1[\s ]500 ₸/);
  });
  it("formats тиын via тенге", () => {
    expect(formatTiyn(150000)).toMatch(/1[\s ]500 ₸/);
  });
  it("appends the unit", () => {
    expect(formatTengePerUnit(420, "м")).toMatch(/420 ₸\/м/);
  });
});
