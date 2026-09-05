/**
 * Hosts next/image is allowed to fetch and optimize remote images from.
 *
 * This used to be a hostname wildcard (`remotePatterns: [{ hostname: "**" }]`),
 * which meant next/image's server-side fetcher — and the admin "paste a
 * photo URL" field, which accepted any string — would pull from literally
 * any host on the internet. That's a real hotlinking risk (a third-party CDN
 * can rate-limit, block, or simply go away, breaking product photos with no
 * warning) and an unnecessary SSRF-shaped surface (staff or a compromised
 * admin session could point the server's image proxy at an arbitrary URL).
 *
 * Uploaded photos always go to Vercel Blob and are always allowed. Anything
 * else must be explicitly listed in LEGACY_IMAGE_HOSTS — a temporary bridge
 * for the hosts already hotlinked in the DB from the original catalog
 * import, until `scripts/migrate-images-to-blob.ts` re-hosts them on Blob.
 * Find the real hosts to list there with `npx tsx scripts/list-image-hosts.ts`.
 */
const BLOB_HOST_PATTERN = /\.public\.blob\.vercel-storage\.com$/;

function legacyHosts(): string[] {
  return (process.env.LEGACY_IMAGE_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
}

export function isAllowedImageHost(hostname: string): boolean {
  return BLOB_HOST_PATTERN.test(hostname) || legacyHosts().includes(hostname);
}

/** For next.config.ts's images.remotePatterns. */
export function imageRemotePatterns(): { protocol: "https"; hostname: string }[] {
  return [
    { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ...legacyHosts().map((hostname) => ({ protocol: "https" as const, hostname })),
  ];
}
