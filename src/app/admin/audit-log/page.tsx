import { AdminPageHeader } from "@/components/admin/page-header";
import {
  AuditLogManager,
  type AuditLogListRow,
} from "@/components/admin/audit-log/audit-log-manager";
import { auditLogAdminRepository } from "@/server/repositories/admin";
import { parseAdminAuditLogQuery, ADMIN_AUDIT_LOG_PAGE_SIZE } from "@/lib/admin/audit-log-url";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminAuditLogPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const query = parseAdminAuditLogQuery(new URLSearchParams(sp as Record<string, string>));

  const [{ rows, total }, entities] = await Promise.all([
    auditLogAdminRepository.listPage({
      page: query.page,
      pageSize: ADMIN_AUDIT_LOG_PAGE_SIZE,
      q: query.q || undefined,
      action: query.action || undefined,
      entity: query.entity || undefined,
    }),
    auditLogAdminRepository.listEntities(),
  ]);

  const data: AuditLogListRow[] = rows.map((r) => ({
    id: r.id,
    action: r.action,
    entity: r.entity,
    entityId: r.entityId,
    summary: r.summary,
    meta: r.meta,
    actorEmail: r.actorEmail,
    createdAt: r.createdAt.toISOString(),
  }));

  const pageCount = Math.max(1, Math.ceil(total / ADMIN_AUDIT_LOG_PAGE_SIZE));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Журнал действий"
        description="Кто и что менял в админ-панели — создание, изменение, удаление, вход/выход."
      />
      <AuditLogManager
        rows={data}
        entities={entities}
        total={total}
        page={query.page}
        pageCount={pageCount}
      />
    </div>
  );
}
