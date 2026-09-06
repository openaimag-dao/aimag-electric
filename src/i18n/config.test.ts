import { describe, expect, it } from "vitest";

import { locales, defaultLocale, isLocale } from "@/i18n/config";

describe("i18n config", () => {
  it("has ru as the default locale", () => {
    expect(defaultLocale).toBe("ru");
    expect(locales).toContain(defaultLocale);
  });

  it("isLocale accepts every configured locale", () => {
    for (const l of locales) expect(isLocale(l)).toBe(true);
  });

  it("isLocale rejects anything else", () => {
    expect(isLocale("en")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale("RU")).toBe(false);
  });
});
