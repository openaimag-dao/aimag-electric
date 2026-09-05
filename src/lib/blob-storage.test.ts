import { describe, expect, it } from "vitest";

import { isVercelBlobUrl } from "@/lib/blob-storage";

describe("isVercelBlobUrl", () => {
  it("accepts a real Blob storage URL", () => {
    expect(isVercelBlobUrl("https://abc123.public.blob.vercel-storage.com/file.pdf")).toBe(true);
  });

  it("rejects an arbitrary external URL", () => {
    expect(isVercelBlobUrl("https://evil.example.com/file.pdf")).toBe(false);
  });

  it("rejects a malformed URL instead of throwing", () => {
    expect(isVercelBlobUrl("not a url")).toBe(false);
  });
});
