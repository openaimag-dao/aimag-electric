# Деплой

## Vercel (рекомендуется)

1. Создайте PostgreSQL (Vercel Storage → Postgres, либо Neon/Supabase) — получите `DATABASE_URL`.
2. Залейте код на GitHub, импортируйте репозиторий в Vercel (Next.js определится автоматически).
3. Переменные окружения: `DATABASE_URL`, `NEXTAUTH_SECRET` (`openssl rand -base64 32`),
   `NEXTAUTH_URL=https://<проект>.vercel.app`.
4. Один раз против той же БД: `npm run db:deploy && npm run db:seed`.
5. Vercel соберёт и опубликует проект.

## Docker

```bash
docker compose up --build
# web → :3000, PostgreSQL → :5432
# внутри контейнера web примените миграции:
docker compose exec web npx prisma migrate deploy
docker compose exec web npm run db:seed
```

Образ использует `output: "standalone"` — минимальный рантайм без dev-зависимостей.

## Прод-чеклист

- [ ] `NEXTAUTH_SECRET` — уникальный секрет, не из примера.
- [ ] HTTPS + корректный `NEXTAUTH_URL`.
- [ ] Бэкапы PostgreSQL.
- [ ] Connection pooling для serverless (PgBouncer / Prisma Accelerate).
- [ ] Мониторинг логов (логгер пишет JSON в stdout).
- [ ] Rate-limit в общем хранилище при >1 инстанса.
