import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Each serverless invocation gets its own Prisma pool against Neon's pooled
 * (pgbouncer) endpoint. Neon's default connection_limit=5/pool_timeout=10 is
 * too tight under concurrent invocations and too short for a cold Neon
 * compute to wake up, so both are widened here unless the URL already sets
 * them explicitly.
 */
function datasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;
  const url = new URL(raw);
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", "3");
  }
  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", "30");
  }
  return url.toString();
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: datasourceUrl(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
