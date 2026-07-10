import "server-only";

/**
 * Lightweight in-memory sliding-window rate limiter. Suitable for a single
 * server instance. For multi-instance deployments swap the Map for a shared
 * store (Redis/Upstash) behind the same interface.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup to avoid unbounded growth (memory-leak guard).
let sweeper: ReturnType<typeof setInterval> | null = null;
function ensureSweeper() {
  if (sweeper) return;
  sweeper = setInterval(() => {
    const now = Date.now();
    for (const [key, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(key);
    }
  }, 60_000);
  // Don't keep the event loop alive just for the sweeper.
  if (typeof sweeper === "object" && "unref" in sweeper) sweeper.unref();
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param key      unique caller identity (e.g. `quote:${ip}`)
 * @param limit    max requests per window
 * @param windowMs window size in ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  ensureSweeper();
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}
