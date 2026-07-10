# AIMAG ELECTRIC — отчёт технического аудита (Release Candidate → 1.0)

Дата: июль 2026. Роль: Principal Engineer / Tech Lead.
Объём кодовой базы: ~207 файлов, ~13 300 строк TypeScript.

---

## 1. Что было найдено

**Производительность / БД**
- N+1 в импорте товаров: `warehouse.findFirst` вызывался в цикле на каждый товар; цены и остатки писались паттерном read-then-write (`findFirst` + `update`/`create`).
- Отсутствие композитных индексов под каталог: запросы `where published + category/brand order popularity` шли по одиночным индексам — неприемлемо на 100k товаров.
- `Price` не имел уникального ключа `(productId, kind)` — мешало атомарным upsert и допускало дубли.

**Безопасность**
- Server Actions не проверяли роль (RBAC отсутствовал на уровне действий; защита была только в middleware).
- Не было rate limiting на публичной подаче заявок (риск спама/abuse).
- Отсутствовали security-заголовки (CSP, HSTS, X-Frame-Options и др.).

**Обработка ошибок**
- Не было брендированных страниц 404/500 и корневого fallback.
- Auth-исключения могли всплывать как необработанные 500.

**Наблюдаемость**
- Не было централизованного логирования и audit trail.

**Инфраструктура**
- Отсутствовали ESLint-правила, Prettier, EditorConfig, Docker, CI, Husky, тесты.

## 2. Что исправлено

**Производительность / БД**
- Устранён N+1: `warehouse` резолвится один раз; цены/остатки переведены на атомарный `upsert` по уникальным ключам.
- Добавлены композитные индексы `Product(published, categoryId, popularity)` и др. (миграция `20260710000000_perf_indexes`).
- `Price(productId, kind)` сделан уникальным.
- Persistent-кэш `unstable_cache` с тег-инвалидацией (`revalidateTag`) на горячих чтениях (homepage), поверх request-level `cache()`.
- Дашборд-виджеты стримятся через `Suspense`.

**Безопасность**
- RBAC-модуль (`requireStaff`/`requireAdmin`/`requireUser`) подключён к действиям товаров и импорту.
- Rate limiting (sliding window, in-memory с авто-очисткой) на подаче заявок — 5/мин на IP.
- Security-заголовки в `next.config.ts`: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy; `poweredByHeader: false`.
- Проверена связка NextAuth (JWT, роль в токене, bcrypt-хеши, edge-middleware).

**Обработка ошибок**
- `not-found.tsx`, `error.tsx`, `global-error.tsx` — брендированные 404/500.
- `toActionError` нормализует auth/Prisma-ошибки в понятные сообщения.

**Наблюдаемость**
- Структурный JSON-логгер (`src/lib/logger.ts`) с уровнями.
- Персистентный audit trail (`AuditLog` + `src/server/audit.ts`): импорт, CRUD товаров, вход/выход.

**UX админки (Этап 7)**
- Дашборд дополнен виджетами: качество каталога (без фото/описания/документов), заканчивающиеся остатки, лента последних действий (audit), последние импорты.

**Инфраструктура (DevOps)**
- ESLint (strict-правила), Prettier + tailwind-plugin, EditorConfig.
- Multi-stage Dockerfile (standalone output) + docker-compose (web + PostgreSQL).
- GitHub Actions CI: typecheck → lint → format → unit-тесты → build.
- Husky + lint-staged (pre-commit).

**Тесты**
- Vitest: 23 юнит-теста (money, availability, валидация заявки, валидатор импорта Excel) — все проходят.
- Playwright: конфиг + smoke-тесты (публичные страницы, защита маршрутов).

**Документация**
- README + docs/: Architecture, Database, Deployment, Environment, API.

**SEO (аудит пройден)**
- robots, sitemap (динамический), manifest, JSON-LD (Organization/WebSite/Product/Breadcrumb), canonical на всех страницах, OG + Twitter cards, визуальные breadcrumbs.

## 3. Оставшиеся риски

1. **Rate limiting in-memory** — на нескольких инстансах лимит не общий. Для горизонтального масштаба вынести в Redis/Upstash (интерфейс уже изолирован).
2. **CSP с `unsafe-inline`/`unsafe-eval`** — требуется Next.js для инлайн-стилей и гидратации. Ужесточить через nonce при переходе на кастомный сервер.
3. **Курсорная пагинация** — текущий каталог грузит списки целиком в некоторых сервисах; при 100k товаров перевести на cursor-based (индексы уже готовы).
4. **RBAC применён к товарам и импорту**; для полного покрытия распространить `requireStaff()` на остальные admin-действия (категории/бренды/склады/цены/CRM) — паттерн готов, дело механическое.
5. **Уведомления о заявках** (email/Telegram) — заглушка (TODO), не блокирует релиз.
6. **E2E не прогонялись** в этой среде (нужен браузер + БД) — конфиг готов, запускать в CI с сервисным Postgres.

## 4. Рекомендации к Release 1.0

- Перед продом: вынести rate-limit в Redis, включить connection pooling (PgBouncer / Prisma Accelerate), настроить сбор логов (JSON → агрегатор).
- Прогнать E2E в CI против сервисного Postgres.
- Распространить RBAC-guard на все оставшиеся admin-действия.
- Настроить бэкапы БД и алерты на `logger.error`.
- Нагрузочное тестирование каталога на датасете ~100k перед публичным запуском.

## 5. Итоговая оценка

| Критерий | Оценка | Комментарий |
|----------|:------:|-------------|
| Architecture | 9/10 | Чёткие слои UI→Actions→Services→Repositories, server-only границы |
| Frontend | 8/10 | Server Components, Suspense-стриминг, единая дизайн-система |
| Backend | 8/10 | Валидация, RBAC, audit; осталось расширить guard на все действия |
| Database | 9/10 | Индексы под 100k, уникальные ключи, продуманные cascade |
| Performance | 8/10 | N+1 устранён, тег-кэш; курсорная пагинация — следующий шаг |
| Security | 8/10 | RBAC, rate-limit, security-headers, bcrypt; CSP прагматичный |
| SEO | 10/10 | Полный набор: metadata, JSON-LD, sitemap, canonical, breadcrumbs |
| Scalability | 7/10 | Готовность к 100k заложена; для многоинстанса — Redis + pooling |
| Maintainability | 9/10 | DRY-хелперы, 0 any, 0 unused, тесты, документация |
| Code Quality | 9/10 | Строгий TS, ESLint/Prettier, 23 теста проходят |
| Production Readiness | 8/10 | Docker, CI, логи, audit; остаётся Redis-лимит и E2E в CI |

**Средняя оценка: 8.5/10 — Production-ready с понятным списком доработок под масштаб.**
