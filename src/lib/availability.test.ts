import { describe, it, expect } from "vitest";
import { deriveAvailabilityFromStock, leadTimeForAvailability } from "./availability";

describe("deriveAvailabilityFromStock", () => {
  it("is in_stock when any warehouse has positive quantity", () => {
    expect(deriveAvailabilityFromStock([{ quantity: 5, restockAt: null }])).toBe("in_stock");
    expect(
      deriveAvailabilityFromStock([
        { quantity: 0, restockAt: null },
        { quantity: 3, restockAt: null },
      ])
    ).toBe("in_stock");
  });
  it("is on_order when zero stock but a restock date exists", () => {
    expect(deriveAvailabilityFromStock([{ quantity: 0, restockAt: new Date() }])).toBe("on_order");
  });
  it("is out when zero stock and no restock", () => {
    expect(deriveAvailabilityFromStock([{ quantity: 0, restockAt: null }])).toBe("out");
    expect(deriveAvailabilityFromStock([])).toBe("out");
  });
});

describe("leadTimeForAvailability", () => {
  it("maps each availability to a human lead time", () => {
    expect(leadTimeForAvailability("in_stock")).toContain("склад");
    expect(leadTimeForAvailability("on_order")).toContain("14");
    expect(leadTimeForAvailability("out")).toContain("запрос");
  });
});
