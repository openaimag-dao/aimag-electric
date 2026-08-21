"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { AdminProductsQuery } from "@/lib/admin/products-url";
import { parseAdminProductsQuery, adminProductsQueryToParams } from "@/lib/admin/products-url";

/** URL is the source of truth for the products table's filters/page — same pattern as the public catalog. */
export function useAdminProductsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = React.useMemo(
    () => parseAdminProductsQuery(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const commit = React.useCallback(
    (next: AdminProductsQuery) => {
      const qs = adminProductsQueryToParams(next).toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const update = React.useCallback(
    (patch: Partial<AdminProductsQuery>, opts?: { keepPage?: boolean }) => {
      const next = { ...query, ...patch };
      if (!opts?.keepPage) next.page = 1;
      commit(next);
    },
    [query, commit]
  );

  return { query, update };
}
