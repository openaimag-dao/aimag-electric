import "server-only";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { ru } from "@/i18n/dictionaries/ru";
import { kk } from "@/i18n/dictionaries/kk";

const dictionaries: Record<Locale, Dictionary> = { ru, kk };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
