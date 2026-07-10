import "server-only";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { currentUser } from "@/server/auth/session";

type AuditAction = "LOGIN" | "LOGOUT" | "CREATE" | "UPDATE" | "DELETE" | "IMPORT" | "EXPORT";

interface AuditInput {
  action: AuditAction;
  entity: string;
  entityId?: string;
  summary: string;
  meta?: Record<string, unknown>;
  ip?: string;
}

/**
 * Records an audit entry and mirrors it to the structured log. Never throws —
 * auditing must not break the primary operation.
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    const user = await currentUser();
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        summary: input.summary,
        meta: input.meta ? (input.meta as object) : undefined,
        actorId: user?.id ?? null,
        actorEmail: user?.email ?? null,
        ip: input.ip ?? null,
      },
    });
    logger.info("audit", {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      actor: user?.email,
    });
  } catch (e) {
    logger.error("audit.failed", { error: String(e), action: input.action, entity: input.entity });
  }
}
