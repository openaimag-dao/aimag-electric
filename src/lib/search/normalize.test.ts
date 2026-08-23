import { describe, it, expect } from "vitest";
import { expandSeparatorVariants } from "./normalize";

describe("expandSeparatorVariants", () => {
  it("returns the query unchanged when there is no digit-bounded separator", () => {
    expect(expandSeparatorVariants("ВВГ")).toEqual(["ВВГ"]);
    expect(expandSeparatorVariants("Max")).toEqual(["Max"]);
  });

  it("expands a Latin x into every other separator variant", () => {
    const variants = expandSeparatorVariants("4x2.5");
    expect(variants).toContain("4x2.5");
    expect(variants).toContain("4х2.5"); // Cyrillic х
    expect(variants).toContain("4×2.5"); // multiplication sign
    expect(variants).toContain("4*2.5");
  });

  it("expands the multiplication sign into every other separator variant", () => {
    const variants = expandSeparatorVariants("4×2.5");
    expect(variants).toContain("4x2.5");
    expect(variants).toContain("4×2.5");
  });

  it("expands the Cyrillic х into every other separator variant", () => {
    const variants = expandSeparatorVariants("4х120");
    expect(variants).toContain("4x120");
    expect(variants).toContain("4×120");
  });

  it("does not touch a bare letter x not between digits", () => {
    expect(expandSeparatorVariants("Maxi")).toEqual(["Maxi"]);
  });

  it("returns unique variants only", () => {
    const variants = expandSeparatorVariants("4x120");
    expect(new Set(variants).size).toBe(variants.length);
  });
});
