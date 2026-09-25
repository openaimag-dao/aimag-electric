import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captureCampaignAttribution, parseCampaign } from "./campaign-attribution";
import { quoteSchema } from "./validations/quote";

describe("campaign attribution", () => {
  let storage: Map<string, string>;
  beforeEach(() => {
    storage = new Map();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-25T00:00:00Z"));
    vi.stubGlobal("window", {
      location: { search: "" },
      sessionStorage: {
        setItem: (key: string, value: string) => storage.set(key, value),
        getItem: (key: string) => storage.get(key) ?? null,
        removeItem: (key: string) => storage.delete(key),
      },
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps only the three supported tags and bounds their length", () => {
    expect(parseCampaign("?utm_source=google&email=private@example.com&gclid=secret")).toEqual({
      utmSource: "google",
    });
    expect(parseCampaign(`?utm_campaign=${"a".repeat(200)}`)?.utmCampaign).toHaveLength(120);
    expect(parseCampaign("?utm_source=%20&phone=123")).toBeUndefined();
  });
  it("retains tags across untagged pages and replaces them with a new campaign", () => {
    captureCampaignAttribution("?utm_source=google&utm_medium=cpc&utm_campaign=cable");
    expect(captureCampaignAttribution("")).toEqual({
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "cable",
    });
    captureCampaignAttribution("?utm_source=partner");
    expect(captureCampaignAttribution("")).toEqual({ utmSource: "partner" });
  });
  it("expires old tags after 24 hours", () => {
    captureCampaignAttribution("?utm_source=google");
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    expect(captureCampaignAttribution("")).toBeUndefined();
    expect(storage.size).toBe(0);
  });
  it("does not break when storage is blocked or malformed", () => {
    storage.set("aimag-campaign-v1", "not json");
    expect(captureCampaignAttribution("")).toBeUndefined();
    vi.stubGlobal("window", {
      location: { search: "" },
      get sessionStorage() {
        throw new Error("blocked");
      },
    });
    expect(captureCampaignAttribution("?utm_source=google")).toEqual({ utmSource: "google" });
    expect(captureCampaignAttribution("")).toBeUndefined();
  });
  it("ignores invalid attribution without rejecting a valid quote", () => {
    const result = quoteSchema.safeParse({
      company: "Тест",
      name: "Клиент",
      phone: "+77000000000",
      message: "Нужен кабель",
      campaign: { utmSource: 42 },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.campaign).toBeUndefined();
  });
});
