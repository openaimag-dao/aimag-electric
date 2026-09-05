/**
 * One-off migration: downloads every ProductImage whose URL points off Vercel
 * Blob storage (i.e. every hotlinked third-party image — see
 * scripts/list-image-hosts.ts for the real list) and re-uploads it to Blob,
 * then repoints the DB row at the new URL. Once this has run clean,
 * LEGACY_IMAGE_HOSTS in next.config.ts's allowlist (src/lib/image-hosts.ts)
 * can be emptied out entirely.
 *
 * Idempotent: only touches rows whose url doesn't already point at
 * *.public.blob.vercel-storage.com, so re-running after a partial failure
 * just picks up where it left off. Requires DATABASE_URL and
 * BLOB_READ_WRITE_TOKEN — this repo's sandbox has neither, so this must be
 * run from an environment that does.
 *
 * Run: `npx tsx scripts/migrate-images-to-blob.ts [--dry-run]`
 */
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, formatFileSize } from "../src/lib/uploads";

const BLOB_HOST_PATTERN = /\.public\.blob\.vercel-storage\.com$/;

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const prisma = new PrismaClient();

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const images = await prisma.productImage.findMany({
      where: { url: { not: null } },
      select: { id: true, url: true, productId: true },
    });

    const toMigrate = images.filter((img) => {
      if (!img.url) return false;
      try {
        return !BLOB_HOST_PATTERN.test(new URL(img.url).hostname);
      } catch {
        return false; // malformed URL — not this script's problem to fix
      }
    });

    console.log(`${toMigrate.length} из ${images.length} фото не на Blob — переносим.\n`);

    for (const img of toMigrate) {
      const url = img.url!;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.error(`[skip] ${url} — HTTP ${res.status}`);
          skipped++;
          continue;
        }
        const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
        if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
          console.error(`[skip] ${url} — недопустимый content-type "${contentType}"`);
          skipped++;
          continue;
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.byteLength > MAX_IMAGE_SIZE) {
          console.error(`[skip] ${url} — файл больше ${formatFileSize(MAX_IMAGE_SIZE)}`);
          skipped++;
          continue;
        }

        const ext = contentType.split("/")[1] ?? "jpg";
        const pathname = `product-images/migrated-${img.id}.${ext}`;

        if (dryRun) {
          console.log(`[dry-run] ${url} -> Blob (${formatFileSize(buffer.byteLength)})`);
        } else {
          const blob = await put(pathname, buffer, { access: "public", contentType });
          await prisma.productImage.update({ where: { id: img.id }, data: { url: blob.url } });
          console.log(`[ok] ${url} -> ${blob.url}`);
        }
        migrated++;
      } catch (e) {
        console.error(`[fail] ${url} —`, e instanceof Error ? e.message : e);
        failed++;
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(
    `\n${dryRun ? "Would migrate" : "Migrated"} ${migrated}; skipped ${skipped}; failed ${failed}.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
