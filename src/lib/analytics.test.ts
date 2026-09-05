import { afterEach, describe, expect, it, vi } from "vitest";

import { track } from "@/lib/analytics";

describe("track", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_YM_ID;
  });

  it("does nothing when window is undefined (SSR)", () => {
    expect(() => track("search", { query: "test" })).not.toThrow();
  });

  it("calls gtag with the event name and params when present", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    track("add_to_cart", { productId: "p1", qty: 2 });
    expect(gtag).toHaveBeenCalledWith("event", "add_to_cart", { productId: "p1", qty: 2 });
  });

  it("calls ym reachGoal when NEXT_PUBLIC_YM_ID is set", () => {
    process.env.NEXT_PUBLIC_YM_ID = "12345";
    const ym = vi.fn();
    vi.stubGlobal("window", { ym });
    track("quote_submit", { itemCount: 3 });
    expect(ym).toHaveBeenCalledWith(12345, "reachGoal", "quote_submit", { itemCount: 3 });
  });

  it("does not call ym when NEXT_PUBLIC_YM_ID is unset, even if window.ym exists", () => {
    const ym = vi.fn();
    vi.stubGlobal("window", { ym });
    track("sort_change", { sort: "price_asc" });
    expect(ym).not.toHaveBeenCalled();
  });

  it("swallows errors thrown by a provider", () => {
    vi.stubGlobal("window", {
      gtag: () => {
        throw new Error("boom");
      },
    });
    expect(() => track("cart_share", {})).not.toThrow();
  });
});
