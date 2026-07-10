# Переменные окружения

| Переменная | Обязательна | Описание |
|-----------|:-----------:|----------|
| `DATABASE_URL` | да | Строка подключения PostgreSQL. Для serverless — пул. |
| `NEXTAUTH_SECRET` | да | Секрет подписи JWT. `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | да (прод) | Публичный URL приложения. |
| `LOG_LEVEL` | нет | `debug`\|`info`\|`warn`\|`error` (по умолчанию info в проде). |

Пример — в `.env.example`. Файл `.env` не коммитится.
