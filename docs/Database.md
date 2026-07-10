# База данных

PostgreSQL + Prisma. Миграции — в `prisma/migrations`, схема — `prisma/schema.prisma`.

## Модель данных

Каталог: `Category`, `Brand`, `Product`, `ProductImage`, `ProductDocument`,
`Attribute`/`AttributeValue` (EAV-характеристики), `Warehouse`, `Stock`, `Price`, `Review`.
Продажи: `Quote`/`QuoteItem`. CRM: `Customer`, `Deal`, `Activity`. Аудит: `AuditLog`.
Auth: `User`, `Account`, `Session`.

## Денежные значения

Цены хранятся в **тиынах** (Int, ₸ ×100) для точности. Конвертация только через `src/lib/money.ts`.

## Наличие

`Availability` не хранится, а выводится из `Stock` (`src/lib/availability.ts`):
есть положительный остаток → `in_stock`; иначе есть `restockAt` → `on_order`; иначе `out`.

## Индексы (под каталог ~100k товаров)

Композитные индексы `Product` под горячие пути каталога:
`(published, categoryId, popularity)`, `(published, brandId, popularity)`,
`(published, popularity)`, `(published, createdAt)`.

Уникальные ключи для атомарных upsert: `Price(productId, kind)`, `Stock(productId, warehouseId)`.

## Cascade rules

- `Product` → images/documents/values/stock/prices/reviews: `onDelete: Cascade`.
- `Product.category`/`brand`: `onDelete: Restrict` (нельзя удалить справочник с товарами).
- `Deal`/`Activity` → `Customer`: `Cascade`. `Deal.quote`/`owner`: `SetNull`.

## Масштабирование

- Пагинация каталога по индексам; для 100k+ — курсорная пагинация (`cursor` в Prisma).
- Импорт использует upsert по уникальным ключам (без N+1 read-then-write).
- Персистентный кэш (`unstable_cache`) снимает нагрузку с БД на горячих чтениях.
- Для многоинстансного деплоя: вынести rate-limit в Redis, включить connection pooling (PgBouncer / Prisma Accelerate).
