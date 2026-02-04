# Backend Monorepo

Монорепозиторий для backend-сервисов Site Builder MVP.

## Структура

```
backend/
├─ apps/              # Точки входа (API gateway/BFF, админка, воркеры)
├─ services/          # Микросервисы (configurator_site и др.)
├─ packages/          # Общие переиспользуемые модули
├─ infra/             # Инфраструктура (docker-compose, k8s, terraform)
├─ tools/             # Скрипты разработки
└─ docs/              # Общая документация
```

## Правила добавления новых сервисов

1. **Сервисы** создаются в `services/<service_name>/` с обязательной структурой:
   - `src/api/` - HTTP-слой
   - `src/domain/` - Бизнес-логика
   - `src/application/` - Use-cases
   - `src/infrastructure/` - Реализации (БД, внешние сервисы)
   - `src/main.ts` - Bootstrap

2. **Общие модули** выносятся в `packages/`:
   - `shared_types/` - Общие типы/DTO
   - `shared_utils/` - Утилиты
   - `shared_contracts/` - Контракты межсервисного взаимодействия

3. **Новые приложения** (API gateway, админка) создаются в `apps/`

4. Каждый сервис должен иметь:
   - `README.md` с описанием и быстрым стартом
   - `Dockerfile` для контейнеризации
   - Тесты в `test/`
   - Документацию API в `docs/`

## Разработка

### Установка зависимостей

```bash
# В корне монорепо
npm install

# Или для конкретного сервиса
cd services/configurator_site
npm install
```

### Запуск локально

```bash
# Запуск инфраструктуры (PostgreSQL, Redis, MinIO)
cd infra/docker
docker-compose up -d

# Запуск сервиса
cd services/configurator_site
npm run dev
```

## Технологии

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Fastify (для HTTP-сервисов)
- **Database**: PostgreSQL, Redis
- **Storage**: MinIO / S3
- **Containerization**: Docker

## CI/CD

См. `tools/ci/` для скриптов CI/CD.

## Документация

- [Архитектура](./docs/)
- [Соглашения](./docs/conventions/)
- [ADR](./docs/adr/)

