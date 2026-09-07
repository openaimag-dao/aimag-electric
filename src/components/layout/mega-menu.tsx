"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface NavCategory {
  slug: string;
  title: string;
}

/**
 * "Каталог" nav item: a plain link (works with JS disabled) that also opens
 * a hover/click dropdown listing every real category from the DB — no
 * invented umbrella groupings, since the data model has no category groups.
 */
export function MegaMenu({
  label,
  href,
  categories,
}: {
  label: string;
  href: string;
  categories: NavCategory[];
}) {
  const [open, setOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  function openNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function closeSoon() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <Link
        href={href}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-steel-600 transition-colors hover:bg-secondary hover:text-primary"
        onFocus={openNow}
        onClick={() => setOpen(false)}
      >
        {label}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </Link>

      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute left-0 top-full z-50 mt-1 w-[560px] rounded-xl border border-border bg-card p-4 shadow-lg"
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
            {categories.map((c) => (
              <Link
                key={c.slug}
                role="menuitem"
                href={`/catalog?cat=${c.slug}`}
                className="truncate rounded-md px-2 py-1.5 text-sm text-steel-600 transition-colors hover:bg-secondary hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {c.title}
              </Link>
            ))}
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <Link
              href={href}
              className="text-sm font-medium text-signal-700 hover:text-signal-600"
              onClick={() => setOpen(false)}
            >
              Весь каталог →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
