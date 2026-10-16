"use client";

import * as React from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
        }
      ) => string;
    };
  }
}

/**
 * Cloudflare Turnstile bot check. Renders nothing until
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY is set — silent no-op, same pattern as
 * GA4/Yandex in SiteAnalytics, until the site key is created in the
 * Cloudflare dashboard and the token is actually verified server-side
 * (see lib/security/turnstile.ts).
 */
export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const onTokenRef = React.useRef(onToken);
  onTokenRef.current = onToken;

  const renderWidget = React.useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile) return;
    window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => onTokenRef.current(token),
    });
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={containerRef} />
    </>
  );
}
