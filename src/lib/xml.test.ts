import { describe, it, expect } from "vitest";
import { escapeXml } from "./xml";

describe("escapeXml", () => {
  it("escapes the five reserved XML characters", () => {
    expect(escapeXml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;"
    );
  });
  it("leaves plain text untouched", () => {
    expect(escapeXml("Кабель ВВГ 3x2.5")).toBe("Кабель ВВГ 3x2.5");
  });
});
