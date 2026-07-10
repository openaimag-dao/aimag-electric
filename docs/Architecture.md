# Архитектура

## Слои

```
UI (Server/Client Components)
  → Server Actions (src/server/actions)     — валидация Zod, RBAC, audit
    → Services (src/server/services)        — бизнес-логика, кэш
      → Repositories (src/server/repositories) — доступ к данным (Prisma)
        → Prisma Client → PostgreSQL
```

Однонаправленный поток: UI никогда не обращается к Prisma напрямую. Мапперы
(`src/server/mappers`) превращают строки БД в DTO (`src/server/dto`).

## Ключевые модули

- `src/lib/security` — RBAC (`requireStaff`/`requireAdmin`), rate limiting.
- `src/lib/money.ts` — единственное место работы с деньгами (тиыны ↔ тенге).
- `src/lib/availability.ts` — единый расчёт наличия из остатков.
- `src/lib/logger.ts` — структурные JSON-логи.
- `src/server/audit.ts` — персистентный audit trail.
- `src/lib/cache-tags.ts` + `unstable_cache` — тег-инвалидация кэша.

## Границы server-only

Файлы с доступом к БД помечены `import "server-only"`, что исключает попадание
серверного кода в клиентский бандл.

## Аутентификация

NextAuth, JWT-стратегия, роль в токене. `src/middleware.ts` защищает `/admin`
(ADMIN/MANAGER) и `/account` (любой авторизованный) на edge.

## Обработка ошибок

`not-found.tsx`, `error.tsx`, `global-error.tsx` дают брендированные 404/500.
Server Actions возвращают `ActionResult`; `toActionError` нормализует
auth/Prisma-ошибки в понятные сообщения без падения в 500.
