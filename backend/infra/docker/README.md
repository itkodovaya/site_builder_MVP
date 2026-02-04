# Docker Infrastructure

Локальная инфраструктура для разработки.

## Назначение

Docker Compose конфигурации для запуска зависимостей сервисов локально:
- PostgreSQL
- Redis
- MinIO (S3-compatible storage)

## Использование

```bash
# Запуск всех сервисов
docker-compose up -d

# Остановка
docker-compose down

# Просмотр логов
docker-compose logs -f

# Пересоздание
docker-compose up -d --force-recreate
```

## Сервисы

- **PostgreSQL**: Порт 5432
- **Redis**: Порт 6379
- **MinIO**: Порт 9000 (API), 9001 (Console)

## Переменные окружения

Создайте `.env` файл с необходимыми переменными (см. `.env.example`).

