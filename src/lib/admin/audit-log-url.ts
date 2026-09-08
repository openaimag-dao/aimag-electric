export const ADMIN_AUDIT_LOG_PAGE_SIZE = 40;

export const AUDIT_ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "CREATE",
  "UPDATE",
  "DELETE",
  "IMPORT",
  "EXPORT",
] as const;
export type AuditActionFilter = "" | (typeof AUDIT_ACTIONS)[number];

export interface AdminAuditLogQuery {
  q: string;
  action: AuditActionFilter;
  entity: string;
  page: number;
}

export const emptyAdminAuditLogQuery: AdminAuditLogQuery = {
  q: "",
  action: "",
  entity: "",
  page: 1,
};

function isAuditAction(value: string | null): value is (typeof AUDIT_ACTIONS)[number] {
  return value !== null && (AUDIT_ACTIONS as readonly string[]).includes(value);
}

export function parseAdminAuditLogQuery(params: URLSearchParams): AdminAuditLogQuery {
  const pageRaw = Number(params.get("page"));
  const action = params.get("action");
  return {
    q: params.get("q") ?? "",
    action: isAuditAction(action) ? action : "",
    entity: params.get("entity") ?? "",
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

export function adminAuditLogQueryToParams(q: AdminAuditLogQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.action) p.set("action", q.action);
  if (q.entity) p.set("entity", q.entity);
  if (q.page > 1) p.set("page", String(q.page));
  return p;
}
