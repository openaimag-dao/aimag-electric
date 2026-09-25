import { z } from "zod";

export const campaignSchema = z.object({
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
});
export type CampaignAttribution = z.infer<typeof campaignSchema>;
const STORAGE_KEY = "aimag-campaign-v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function parseCampaign(search: string): CampaignAttribution | undefined {
  const params = new URLSearchParams(search);
  const clean = (name: string) => params.get(name)?.trim().slice(0, 120) || undefined;
  const campaign = {
    utmSource: clean("utm_source"),
    utmMedium: clean("utm_medium"),
    utmCampaign: clean("utm_campaign"),
  };
  return Object.values(campaign).some(Boolean) ? campaign : undefined;
}

/** Last tagged visit in this tab, retained across navigation for at most 24 hours. */
export function captureCampaignAttribution(search?: string): CampaignAttribution | undefined {
  if (typeof window === "undefined") return;
  const current = parseCampaign(search ?? window.location.search);
  try {
    if (current) {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ campaign: current, savedAt: Date.now() })
      );
      return current;
    }
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    const parsed = campaignSchema.safeParse(saved?.campaign);
    const age = Date.now() - saved?.savedAt;
    if (
      typeof saved?.savedAt === "number" &&
      Number.isFinite(age) &&
      age >= 0 &&
      age < MAX_AGE_MS &&
      parsed.success
    ) {
      return parsed.data;
    }
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Blocked storage or corrupt data must never prevent a quote submission.
  }
  return current;
}
