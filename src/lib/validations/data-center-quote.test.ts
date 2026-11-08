import { describe, it, expect } from "vitest";
import { dataCenterQuoteSchema } from "./data-center-quote";

describe("dataCenterQuoteSchema", () => {
  const valid = {
    company: "ТОО Дата Центр",
    name: "Иван",
    phone: "+7 700 000 00 00",
    email: "procurement@example.com",
    region: "Шымкент",
    categories: ["Системы электроснабжения", "Кабельная продукция"],
  };

  it("accepts a well-formed request with no items/comment", () => {
    expect(dataCenterQuoteSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a request with no category selected", () => {
    expect(dataCenterQuoteSchema.safeParse({ ...valid, categories: [] }).success).toBe(false);
  });

  it("accepts item lines with no productId required", () => {
    const result = dataCenterQuoteSchema.safeParse({
      ...valid,
      items: [{ title: "UPS 20 кВА", qty: 2, unit: "шт" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an item with a non-positive quantity", () => {
    const result = dataCenterQuoteSchema.safeParse({
      ...valid,
      items: [{ title: "UPS 20 кВА", qty: 0, unit: "шт" }],
    });
    expect(result.success).toBe(false);
  });

  it("validates a 12-digit BIN and rejects a malformed one", () => {
    expect(dataCenterQuoteSchema.safeParse({ ...valid, bin: "123456789012" }).success).toBe(true);
    expect(dataCenterQuoteSchema.safeParse({ ...valid, bin: "" }).success).toBe(true);
    expect(dataCenterQuoteSchema.safeParse({ ...valid, bin: "12345" }).success).toBe(false);
  });

  it("accepts up to 10 attached documents", () => {
    const documents = Array.from({ length: 10 }, (_, i) => ({
      title: `spec-${i}.pdf`,
      url: `https://blob.example.com/spec-${i}.pdf`,
      size: "1.2 МБ",
    }));
    expect(dataCenterQuoteSchema.safeParse({ ...valid, documents }).success).toBe(true);
  });

  it("rejects a missing company and a bad phone", () => {
    expect(dataCenterQuoteSchema.safeParse({ ...valid, company: "" }).success).toBe(false);
    expect(dataCenterQuoteSchema.safeParse({ ...valid, phone: "abc" }).success).toBe(false);
  });
});
