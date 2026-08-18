# Деплой

## Vercel (рекомендуется)

1. Создайте PostgreSQL (Vercel Storage → Postgres, либо Neon/Supabase) — получите `DATABASE_URL`.
2. Залейте код на GitHub, импортируйте репозиторий в Vercel (Next.js определится автоматически).
3. Переменные окружения: `DATABASE_URL`, `NEXTAUTH_SECRET` (`openssl rand -base64 32`),
   `NEXTAUTH_URL=https://<проект>.vercel.app`. Задайте их для **всех** окружений
   (Production, Preview и Development) в Project Settings → Environment Variables —
   иначе preview-деплои веток падают с `Environment variable not found: DATABASE_URL`
   и `[next-auth][error][NO_SECRET]`.
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
- [x] Connection pooling для serverless — `src/lib/prisma.ts` подставляет
      `connection_limit=3&pool_timeout=30` в `DATABASE_URL`, если они там не заданы
      (используйте Neon pooled-эндпоинт, `-pooler` в хосте).
- [ ] Мониторинг логов (логгер пишет JSON в stdout).
- [ ] Rate-limit в общем хранилище при >1 инстанса.
