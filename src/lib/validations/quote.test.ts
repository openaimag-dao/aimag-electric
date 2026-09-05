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
  it("accepts an empty honeypot (real user)", () => {
    expect(quoteSchema.safeParse({ ...valid, website: "" }).success).toBe(true);
  });
  it("still parses a filled honeypot (rejection happens in the action, not the schema)", () => {
    const parsed = quoteSchema.safeParse({ ...valid, website: "http://spam.example" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.website).toBe("http://spam.example");
  });
  it("accepts up to 5 attachments", () => {
    const attachments = Array.from({ length: 5 }, (_, i) => ({
      url: `https://x.public.blob.vercel-storage.com/f${i}.pdf`,
      filename: `f${i}.pdf`,
      size: 1024,
      contentType: "application/pdf",
    }));
    expect(quoteSchema.safeParse({ ...valid, attachments }).success).toBe(true);
  });
  it("rejects more than 5 attachments", () => {
    const attachments = Array.from({ length: 6 }, (_, i) => ({
      url: `https://x.public.blob.vercel-storage.com/f${i}.pdf`,
      filename: `f${i}.pdf`,
      size: 1024,
      contentType: "application/pdf",
    }));
    expect(quoteSchema.safeParse({ ...valid, attachments }).success).toBe(false);
  });
});
