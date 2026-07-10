# API / Server Actions

Приложение использует Server Actions (не REST). Все мутации валидируются Zod на сервере,
защищены RBAC и возвращают единый тип `ActionResult<T>` (`{ ok, data?, error?, fieldErrors? }`).

## Публичные

- `submitQuote(input)` — заявка на КП. Rate-limit 5/мин на IP. Логируется.

## Админские (требуют ADMIN/MANAGER)

- Товары: `createProduct` / `updateProduct` / `deleteProduct` — audit CREATE/UPDATE/DELETE.
- Справочники: `create|update|delete` для категорий, брендов, складов, цен, документов, пользователей.
- Импорт: `getImportContext`, `applyImport(kind, rows, fileName)` — audit IMPORT, поддержка
  products/categories/brands/prices/stock, upsert по уникальным ключам.
- CRM: действия для `Customer`, `Deal` (+`setDealStage`), `Activity`.

## Системные маршруты

- `GET /api/auth/[...nextauth]` — NextAuth.
- `GET /robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` — SEO (Metadata API).

## Формат ошибок

`toActionError` нормализует исключения: `AuthenticationError` → «Требуется вход»,
`AuthorizationError` → «Недостаточно прав», Prisma-коды (P2002/P2003/P2025) → понятный текст.
