"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { AdminAuditLogQuery } from "@/lib/admin/audit-log-url";
import { parseAdminAuditLogQuery, adminAuditLogQueryToParams } from "@/lib/admin/audit-log-url";

/** URL is the source of truth for the audit log table's filters/page — same pattern as the products table. */
export function useAdminAuditLogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = React.useMemo(
    () => parseAdminAuditLogQuery(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const commit = React.useCallback(
    (next: AdminAuditLogQuery) => {
      const qs = adminAuditLogQueryToParams(next).toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const update = React.useCallback(
    (patch: Partial<AdminAuditLogQuery>, opts?: { keepPage?: boolean }) => {
      const next = { ...query, ...patch };
      if (!opts?.keepPage) next.page = 1;
      commit(next);
    },
    [query, commit]
  );

  return { query, update };
}
