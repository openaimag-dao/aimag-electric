import { afterEach, describe, expect, it } from "vitest";

import { isAllowedImageHost, imageRemotePatterns } from "@/lib/image-hosts";

describe("image-hosts", () => {
  afterEach(() => {
    delete process.env.LEGACY_IMAGE_HOSTS;
  });

  it("always allows Vercel Blob storage hosts", () => {
    expect(isAllowedImageHost("abc123.public.blob.vercel-storage.com")).toBe(true);
  });

  it("rejects an arbitrary host with no allowlist configured", () => {
    expect(isAllowedImageHost("evil.example.com")).toBe(false);
  });

  it("allows a host listed in LEGACY_IMAGE_HOSTS", () => {
    process.env.LEGACY_IMAGE_HOSTS = "cdn.example.com, other.example.com";
    expect(isAllowedImageHost("cdn.example.com")).toBe(true);
    expect(isAllowedImageHost("other.example.com")).toBe(true);
    expect(isAllowedImageHost("unlisted.example.com")).toBe(false);
  });

  it("imageRemotePatterns always includes the Blob wildcard plus any legacy hosts", () => {
    process.env.LEGACY_IMAGE_HOSTS = "cdn.example.com";
    const patterns = imageRemotePatterns();
    expect(patterns).toContainEqual({
      protocol: "https",
      hostname: "*.public.blob.vercel-storage.com",
    });
    expect(patterns).toContainEqual({ protocol: "https", hostname: "cdn.example.com" });
  });
});
