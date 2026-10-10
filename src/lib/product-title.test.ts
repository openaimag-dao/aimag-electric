import { describe, expect, it } from "vitest";
import { normalizeProductTitle } from "./product-title";

describe("product title presentation", () => {
  it.each([
    ["  Кабель  АВБшВ  3*240мс+1*120мс (N)-1  ", "Кабель АВБшВ 3×240мс+1×120мс (N)-1"],
    ["Кабель ВВГнг(А)-LS 3 х 2.5 0,66кВ", "Кабель ВВГнг(А)-LS 3×2,5 0,66кВ"],
    ["Провод СИП-4 4X16", "Провод СИП-4 4×16"],
    ["Автомат  ВА47-29  C16", "Автомат ВА47-29 C16"],
    ["Втулка  3*20", "Втулка 3*20"],
  ])("cleans %s without changing technical designations", (raw, expected) => {
    expect(normalizeProductTitle(raw)).toBe(expected);
    expect(normalizeProductTitle(expected)).toBe(expected);
  });
});
