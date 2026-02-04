# Conventions

Стандарты и соглашения для разработки.

## Содержание

- **Code Style**: Стандарты форматирования кода
- **Naming**: Правила именования файлов, переменных, функций
- **API Versioning**: Правила версионирования API
- **Schema Versioning**: Правила версионирования схем данных

## Стандарты

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- 2 spaces для отступов

### Naming

- **Files**: kebab-case (`create-draft-use-case.ts`)
- **Classes**: PascalCase (`CreateDraftUseCase`)
- **Functions/Variables**: camelCase (`createDraft`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_TTL_HOURS`)

### API Versioning

- Используйте префиксы: `/v1/`, `/v2/`
- Breaking changes требуют новой версии
- Документируйте изменения в changelog

### Schema Versioning

- Версионируйте схемы при breaking changes
- Поддерживайте обратную совместимость когда возможно
- Используйте миграции для обновления данных

