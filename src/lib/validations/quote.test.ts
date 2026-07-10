import { describe, it, expect } from "vitest";
import { quoteSchema } from "./quote";

describe("quoteSchema", () => {
  const valid = {
    company: "ТОО Тест",
    name: "Иван",
    phone: "+7 700 000 00 00",
    email: "test@example.com",
    message: "Нужен кабель ВВГ 3х2.5, 500 метров",
  };

  it("accepts a well-formed quote", () => {
    expect(quoteSchema.safeParse(valid).success).toBe(true);
  });
  it("accepts an empty email (optional)", () => {
    expect(quoteSchema.safeParse({ ...valid, email: "" }).success).toBe(true);
  });
  it("rejects a bad email", () => {
    expect(quoteSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });
  it("rejects a missing company", () => {
    expect(quoteSchema.safeParse({ ...valid, company: "" }).success).toBe(false);
  });
  it("rejects a too-short message", () => {
    expect(quoteSchema.safeParse({ ...valid, message: "хай" }).success).toBe(false);
  });
});
