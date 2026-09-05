"use server";

import { cookies } from "next/headers";

import { isLocale } from "@/i18n/config";
import { LOCALE_COOKIE } from "@/i18n/locale-cookie";
import { ok, fail, type ActionResult } from "@/server/actions/action-result";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Sets the visitor's language preference — read back by getLocale() on the next render. */
export async function setLocale(locale: string): Promise<ActionResult> {
  if (!isLocale(locale)) return fail("Неизвестный язык");
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
    sameSite: "lax",
  });
  return ok();
}
