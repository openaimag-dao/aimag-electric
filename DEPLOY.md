# AIMAG ELECTRIC — запуск и деплой

B2B-платформа электротехнической продукции. Next.js 15 (App Router), PostgreSQL + Prisma, NextAuth.

## Локальный запуск

```bash
npm install                 # ставит зависимости, генерирует Prisma Client (postinstall)
cp .env.example .env        # заполните DATABASE_URL и NEXTAUTH_SECRET
npm run db:deploy           # применяет миграции (prisma migrate deploy)
npm run db:seed             # наполняет каталог + демо-пользователей
npm run dev                 # http://localhost:3000
```

`NEXTAUTH_SECRET` сгенерируйте: `openssl rand -base64 32`.

## Демо-доступы (после `db:seed`)

| Роль | E-mail | Пароль | Что видит |
|------|--------|--------|-----------|
| Администратор | `admin@aimag.kz` | `aimag123` | Полная админка + CRM |
| Менеджер | `manager@aimag.kz` | `aimag123` | Админка, CRM, кабинет сотрудника |
| Клиент | `client@aimag.kz` | `aimag123` | Личный кабинет: заявки, сделки |

Вход — `/login`. Кабинет — `/account`. Админка — `/admin` (только ADMIN/MANAGER).

## Деплой на Vercel

1. Создайте PostgreSQL: Vercel Storage → Postgres (или Neon/Supabase). Это даст `DATABASE_URL`.
2. Залейте код на GitHub, импортируйте репозиторий в Vercel (Next.js определится сам).
3. Переменные окружения в проекте Vercel:
   - `DATABASE_URL` — строка подключения к БД
   - `NEXTAUTH_SECRET` — случайная строка
   - `NEXTAUTH_URL` — `https://<ваш-проект>.vercel.app`
4. Локально против той же БД один раз: `npm run db:deploy && npm run db:seed`.
5. Vercel соберёт и опубликует проект.

## Структура

- `/` — маркетинговая витрина, `/catalog` — каталог с фильтрами, `/catalog/[slug]` — карточка товара
- `/admin` — управление каталогом, заявками, импорт, CRM (клиенты + воронка сделок)
- `/account` — личный кабинет (клиент видит свои заявки/сделки, сотрудник — свою нагрузку)
- SEO: `/robots.txt`, `/sitemap.xml`, JSON-LD (Organization, Product, Breadcrumb), манифест

## Заметка про песочницу разработки

Проект собирался в среде, где движок Prisma и Google Fonts не скачиваются. На вашей машине оба
работают штатно: Prisma Client генерируется через `postinstall`, шрифты грузятся с Google Fonts.
Никаких обходных заглушек в поставке нет.
