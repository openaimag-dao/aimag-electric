import { describe, expect, it } from "vitest";
import { parseAdminProductsQuery, adminProductsQueryToParams } from "./products-url";
import { QUALITY_FILTERS } from "./product-quality";

describe("admin product filters", () => {
  it.each(QUALITY_FILTERS)(
    "preserves supported quality filter %s together with search",
    (quality) => {
      const query = parseAdminProductsQuery(
        new URLSearchParams({ quality, q: "ВВГ", page: "2", status: "published" })
      );
      expect(query).toMatchObject({ quality, q: "ВВГ", page: 2, status: "published" });
      expect(parseAdminProductsQuery(adminProductsQueryToParams(query))).toEqual(query);
    }
  );
  it("discards unsupported quality and status values", () => {
    expect(
      parseAdminProductsQuery(new URLSearchParams("quality=unknown&status=unknown"))
    ).toMatchObject({ quality: "", status: "" });
  });
  it.each(["0", "-1", "1.5", "NaN", "Infinity", "9007199254740992", "2147483647"])(
    "normalizes invalid page %s before it reaches Prisma",
    (page) => {
      expect(parseAdminProductsQuery(new URLSearchParams({ page })).page).toBe(1);
    }
  );
});
