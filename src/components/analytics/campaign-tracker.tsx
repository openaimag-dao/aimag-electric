"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureCampaignAttribution } from "@/lib/campaign-attribution";

export function CampaignTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (/^\/(?:admin|account|kp)(?:\/|$)/.test(pathname)) return;
    captureCampaignAttribution(searchParams.toString());
  }, [pathname, searchParams]);
  return null;
}
