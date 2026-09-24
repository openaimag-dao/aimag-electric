"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** One listener covers contact links in the header, footer and product pages. */
export function ContactClickTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      if (/^\/(?:admin|account|kp)(?:\/|$)/.test(window.location.pathname)) return;
      const anchor = event.target.closest("a");
      const href = anchor?.getAttribute("href");
      if (!href) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      const method =
        url.protocol === "tel:"
          ? "phone"
          : url.protocol === "mailto:"
            ? "email"
            : ["wa.me", "api.whatsapp.com"].includes(url.hostname)
              ? "whatsapp"
              : null;
      if (!method) return;
      // Do not send phone numbers, message text, email addresses or URL queries.
      track("contact_click", { method, page_path: window.location.pathname });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
