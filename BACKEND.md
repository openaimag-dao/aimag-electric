# AIMAG ELECTRIC — Production Backend

Sprint 6 переводит проект с демо-данных на PostgreSQL через Prisma. Все
страницы получают данные из БД; mock-данных в рантайме нет.

## Быстрый старт

```bash
npm install                 # postinstall → prisma generate (нужен интернет)
cp .env.example .env        # заполните DATABASE_URL и NEXTAUTH_SECRET
npm run db:deploy           # применить миграции (prisma migrate deploy)
npm run db:seed             # заполнить БД из снапшота каталога
npm run dev
```

Для локальной разработки со сбросом: `npm run db:reset` (drop + migrate + seed).

## Модели (10 + вспомогательные)

`Category`, `Brand`, `Product`, `ProductImage`, `ProductDocument`,
`Attribute`, `AttributeValue`, `Warehouse`, `Stock`, `Price` — плюс `Review`,
`Quote`/`QuoteItem` и модели NextAuth (`User`, `Account`, `Session`,
`VerificationToken`).

Ключевые решения:
- **EAV-спецификации** (`Attribute` + `AttributeValue`): материал, жилы,
  сечение, напряжение — гибкие фильтруемые параметры без изменения схемы.
- **Наличие** вычисляется из `Stock` по складам (`Warehouse`), а не хранится
  флагом — источник правды один.
- **Цены** в `Price` хранятся в тиынах (Int) для точности, с типами
  `BASE`/`WHOLESALE`/`PROMO`, объёмными порогами (`minQty`) и периодом действия.

## Архитектура: repository → service → UI

```
src/server/
├── repositories/     только доступ к Prisma (никакой логики)
│   ├── product-repository.ts
│   ├── category-repository.ts
│   ├── brand-repository.ts
│   └── quote-repository.ts
├── mappers/          Prisma-строки → доменные DTO
│   └── product.ts    (derivePrice, deriveAvailability, toCatalogDTO, toDetailDTO)
├── services/         бизнес-логика поверх репозиториев (+ React cache)
│   ├── catalog-service.ts   query/facets/count
│   ├── product-service.ts   getBySlug/getRelated/allSlugs
│   └── home-service.ts      categories/brands/popularProducts
├── actions/          Server Actions ("use server")
│   └── quote-actions.ts     submitQuote — валидация Zod + запись в БД
└── dto.ts            доменные DTO (совпадают по форме с UI-типами)
```

- **Repositories** помечены `import "server-only"` — не утекут в клиент.
- **Services** используют `cache()` из React: один запрос переиспользует один
  round-trip к БД между страницей, фасетами и счётчиком.
- **DTO** повторяют форму `CatalogProduct`/`ProductDetail`, поэтому UI-компоненты
  не изменились — поменялся только источник данных.

## Server Actions

Форма «Получить КП» вызывает `submitQuote` (`src/server/actions`), которая
валидирует данные той же Zod-схемой и пишет `Quote` в БД. Роут `/api/quote`
удалён за ненадобностью.

## Данные на страницах (всё из БД)

| Страница | Источник |
| --- | --- |
| `/` (главная) | `homeService` — категории, бренды, популярные товары |
| `/catalog` | `catalogService.loadProducts/getCategoryNames/count` |
| `/catalog/[slug]` | `productService.getBySlug/getRelated` |

Страницы помечены `force-dynamic` — рендерятся из БД на каждый запрос. Для
пре-рендера товаров на билде верните slug'и в `generateStaticParams` и уберите
`force-dynamic` (нужен доступ к БД во время сборки) либо используйте ISR
(`export const revalidate = 3600`).

## Скрипты БД

| Команда | Действие |
| --- | --- |
| `npm run db:generate` | Генерация Prisma client |
| `npm run db:migrate` | `prisma migrate dev` (создать/применить миграции) |
| `npm run db:deploy` | `prisma migrate deploy` (прод) |
| `npm run db:seed` | Заполнить БД (`prisma/seed.ts`) |
| `npm run db:reset` | Полный сброс + миграции + seed |
| `npm run db:studio` | Prisma Studio |

## Миграции

`prisma/migrations/20260107000000_init/migration.sql` — начальная схема
(таблицы, индексы, внешние ключи). Применяется `db:deploy` или `db:migrate`.
