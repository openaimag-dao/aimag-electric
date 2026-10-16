import "server-only";

import { logger } from "@/lib/logger";

let warnedNoSecret = false;

/**
 * Verifies a Cloudflare Turnstile token server-side. Without
 * TURNSTILE_SECRET_KEY configured this is a no-op that passes everything
 * (warns once) — not a fake verification, same pattern as the Telegram
 * notify channel. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY (client) and
 * TURNSTILE_SECRET_KEY (server) from the Cloudflare dashboard to enable.
 */
export async function verifyTurnstile(
  token: string | undefined,
  remoteIp: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (!warnedNoSecret) {
      logger.warn("turnstile.not_configured", {
        hint: "Set TURNSTILE_SECRET_KEY to enable bot verification",
      });
      warnedNoSecret = true;
    }
    return true;
  }
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: remoteIp });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      // Cloudflare's own endpoint being down must never block a real
      // customer's quote — fail open, same as the other optional checks here.
      logger.error("turnstile.verify_failed", { status: res.status });
      return true;
    }
    const result: { success?: boolean } = await res.json();
    return result.success === true;
  } catch {
    logger.error("turnstile.verify_unavailable", { reason: "timeout_or_network" });
    return true;
  }
}
