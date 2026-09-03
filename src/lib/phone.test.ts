import { describe, it, expect } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("folds +7, 8, and bare 7 prefixes to the same subscriber number", () => {
    expect(normalizePhone("+7 701 234 56 78")).toBe(normalizePhone("8 701 234 56 78"));
    expect(normalizePhone("8 701 234 56 78")).toBe(normalizePhone("87012345678"));
  });
  it("ignores spacing, dashes, and parens", () => {
    expect(normalizePhone("+7 (701) 234-56-78")).toBe(normalizePhone("+77012345678"));
  });
  it("returns null when there aren't enough digits for a real number", () => {
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });
  it("returns the last 10 digits", () => {
    expect(normalizePhone("+77012345678")).toBe("7012345678");
  });
});
