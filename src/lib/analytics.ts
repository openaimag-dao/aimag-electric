"use client";

/**
 * Thin wrapper over GA4 (gtag) and Yandex.Metrika (reachGoal). Safe no-op
 * when a counter isn't configured (see SiteAnalytics — gtag/ym are only
 * defined once their script loads) or when called during SSR — mirrors the
 * same "never fake tracking" principle as SiteAnalytics itself.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    ym?: (...args: unknown[]) => void;
  }
}

const YM_ID = process.env.NEXT_PUBLIC_YM_ID;

export function track(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", event, params);
  if (YM_ID) window.ym?.(Number(YM_ID), "reachGoal", event, params);
}
