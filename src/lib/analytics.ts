"use client";

/**
 * Unified custom-event tracker for GA4 + Yandex.Metrika — both are only
 * ever loaded if their measurement ID is configured (see SiteAnalytics),
 * so track() is a safe no-op in any environment without them, same "no
 * fabricated tracking" rule as the rest of the analytics setup.
 *
 * Metrika goals must be created with a matching name in the counter's
 * settings for "reachGoal" to actually record them — Metrika doesn't
 * auto-create custom goals from arbitrary event names the way GA4 does.
 */
export type AnalyticsEventName =
  | "search"
  | "product_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "quote_dialog_open"
  | "quote_submit"
  | "cart_export"
  | "cart_share"
  | "save_as_project"
  | "catalog_filter_apply"
  | "sort_change";

export type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    ym?: (...args: unknown[]) => void;
  }
}

export function track(event: AnalyticsEventName, params: AnalyticsEventParams = {}): void {
  if (typeof window === "undefined") return;

  try {
    window.gtag?.("event", event, params);
  } catch {
    // Analytics must never break the feature it's attached to.
  }

  const ymId = process.env.NEXT_PUBLIC_YM_ID;
  if (ymId) {
    try {
      window.ym?.(Number(ymId), "reachGoal", event, params);
    } catch {
      // best-effort, same as above
    }
  }
}
