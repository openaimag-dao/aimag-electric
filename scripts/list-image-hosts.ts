/**
 * Read-only report: groups every ProductImage.url by hostname and prints
 * counts. Run this first, against production, to get the real list of
 * hotlinked third-party hosts — the site's next.config.ts remotePatterns
 * allowlist (see src/lib/image-hosts.ts) needs to either include them via
 * LEGACY_IMAGE_HOSTS, or scripts/migrate-images-to-blob.ts needs to run
 * first so nothing points at them anymore.
 *
 * Run: `npx tsx scripts/list-image-hosts.ts`
 */
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const images = await prisma.productImage.findMany({ select: { url: true } });
    const byHost = new Map<string, number>();
    let nullCount = 0;

    for (const img of images) {
      if (!img.url) {
        nullCount++;
        continue;
      }
      let host: string;
      try {
        host = new URL(img.url).hostname;
      } catch {
        host = "(некорректный URL)";
      }
      byHost.set(host, (byHost.get(host) ?? 0) + 1);
    }

    console.log(`Всего строк ProductImage: ${images.length} (без URL: ${nullCount})\n`);
    console.log("Хостов найдено:", byHost.size);
    [...byHost.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([host, count]) => console.log(`  ${count.toString().padStart(6)}  ${host}`));

    console.log(
      "\nБлочное хранилище Vercel Blob (*.public.blob.vercel-storage.com) уже разрешено по умолчанию — его в списке выше можно игнорировать."
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
