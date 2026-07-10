"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { CatalogFilters } from "@/types/catalog";
import { parseFilters, filtersToParams } from "@/lib/catalog-url";

type Updater = (prev: CatalogFilters) => CatalogFilters;

/**
 * Reads catalog filters from the URL and writes them back — the URL is the
 * single source of truth, so any catalog view is shareable and bookmarkable.
 * Mutating filters (except paging/sort) resets the page to 1.
 */
export function useCatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = React.useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const commit = React.useCallback(
    (next: CatalogFilters) => {
      const qs = filtersToParams(next).toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const update = React.useCallback(
    (updater: Updater, opts?: { keepPage?: boolean }) => {
      const next = updater(filters);
      if (!opts?.keepPage) next.page = 1;
      commit(next);
    },
    [filters, commit]
  );

  /** Toggle a value inside an array-typed facet. */
  const toggle = React.useCallback(
    <K extends "categories" | "manufacturers" | "materials">(
      key: K,
      value: string
    ) => {
      update((prev) => {
        const set = new Set(prev[key]);
        set.has(value) ? set.delete(value) : set.add(value);
        return { ...prev, [key]: Array.from(set) };
      });
    },
    [update]
  );

  const toggleNum = React.useCallback(
    (key: "cores" | "crossSections" | "voltages", value: number) => {
      update((prev) => {
        const set = new Set(prev[key]);
        set.has(value) ? set.delete(value) : set.add(value);
        return { ...prev, [key]: Array.from(set) };
      });
    },
    [update]
  );

  return { filters, update, toggle, toggleNum, commit };
}
