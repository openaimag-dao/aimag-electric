# AIMAG ELECTRIC

B2B-платформа электротехнической продукции для рынка Казахстана. Каталог с фильтрами,
запрос коммерческих предложений, админ-панель с импортом Excel/CSV, CRM (клиенты + воронка
сделок) и личный кабинет для клиентов и сотрудников.

## Стек

Next.js 15 (App Router, Server Components) · TypeScript · Tailwind CSS · Prisma + PostgreSQL ·
NextAuth (JWT) · Zod · Vitest · Playwright.

## Быстрый старт

```bash
npm install
cp .env.example .env          # заполните DATABASE_URL, NEXTAUTH_SECRET
npm run db:deploy             # применить миграции
npm run db:seed               # каталог + демо-пользователи
npm run dev                   # http://localhost:3000
```

Демо-доступы (пароль `aimag123`): `admin@aimag.kz`, `manager@aimag.kz`, `client@aimag.kz`.

## Скрипты

| Скрипт | Назначение |
|--------|-----------|
| `npm run dev` | Дев-сервер |
| `npm run build` / `start` | Прод-сборка и запуск |
| `npm run db:deploy` / `db:seed` | Миграции / наполнение |
| `npm run lint` / `format` / `typecheck` | Качество кода |
| `npm test` | Юнит-тесты (Vitest) |
| `npm run test:e2e` | E2E (Playwright) |

## Документация

- [Architecture.md](./docs/Architecture.md) — слои и структура
- [Database.md](./docs/Database.md) — схема, индексы, масштабирование
- [Deployment.md](./docs/Deployment.md) — деплой (Vercel / Docker)
- [Environment.md](./docs/Environment.md) — переменные окружения
- [API.md](./docs/API.md) — Server Actions и маршруты

## Docker

```bash
docker compose up --build      # web + PostgreSQL
```
