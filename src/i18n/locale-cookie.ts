import "server-only";

import { cookies } from "next/headers";

import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

export const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Locale resolution is cookie-only for now (no per-locale URLs — see the
 * Block 9 PR description for why). Falls back to the Russian default for
 * anyone who hasn't picked a language yet, never guessed from
 * Accept-Language: a first-time Kazakh-speaking visitor still gets the same
 * Russian default everyone else does until they use the switcher, rather
 * than us silently serving a mostly-untranslated Kazakh UI as if it were finished.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value && isLocale(value) ? value : defaultLocale;
}
