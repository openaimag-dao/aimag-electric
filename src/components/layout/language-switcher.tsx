"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";

import { cn } from "@/lib/utils";
import { setLocale } from "@/server/actions";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

/**
 * Two-way toggle (not a full dropdown — there are only two locales right
 * now). Sets a cookie server-side, then refreshes so the server components
 * that read it (layout, header/footer nav) re-render with the new locale.
 */
export function LanguageSwitcher({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function switchTo(next: Locale) {
    if (next === locale || pending) return;
    setPending(true);
    await setLocale(next);
    router.refresh();
    setPending(false);
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-md border border-border p-0.5 text-xs"
      role="group"
      aria-label={dict.languageSwitcher.label}
    >
      <Languages className="ml-1 size-3.5 text-muted-foreground" aria-hidden />
      <button
        type="button"
        onClick={() => switchTo("ru")}
        aria-pressed={locale === "ru"}
        disabled={pending}
        className={cn(
          "rounded px-1.5 py-1 font-medium transition-colors",
          locale === "ru"
            ? "bg-primary text-primary-foreground"
            : "text-steel-600 hover:bg-secondary hover:text-primary"
        )}
      >
        {dict.languageSwitcher.ru}
      </button>
      <button
        type="button"
        onClick={() => switchTo("kk")}
        aria-pressed={locale === "kk"}
        disabled={pending}
        className={cn(
          "rounded px-1.5 py-1 font-medium transition-colors",
          locale === "kk"
            ? "bg-primary text-primary-foreground"
            : "text-steel-600 hover:bg-secondary hover:text-primary"
        )}
      >
        {dict.languageSwitcher.kk}
      </button>
    </div>
  );
}
