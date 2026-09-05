/** Shared with lib/image-hosts.ts (next/image allowlist) and quote attachment validation. */
export const BLOB_HOST_PATTERN = /\.public\.blob\.vercel-storage\.com$/;

/** True if `url` points at our own Vercel Blob store — not an arbitrary client-supplied URL. */
export function isVercelBlobUrl(url: string): boolean {
  try {
    return BLOB_HOST_PATTERN.test(new URL(url).hostname);
  } catch {
    return false;
  }
}
