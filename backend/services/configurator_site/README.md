# Configurator Site Service

**Anonymous, stateless microservice for website draft management and configuration generation.**

## Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Run migrations
npm run migrate

# Start service
npm run dev
```

## What This Service Does

✅ **Anonymous Draft Management** - Create and edit drafts without user accounts
✅ **TTL-Based Storage** - Drafts expire automatically after 24 hours
✅ **Config Generation** - Convert drafts to structured site configurations
✅ **Safe Preview Rendering** - HTML/JSON previews with XSS protection
✅ **Server-to-Server Commit** - Migrate drafts to permanent storage

## Core Concepts

### 1. Draft (Temporary)

Temporary website draft stored in **Redis with TTL**:
- Anonymous (no user ID)
- Expires in 24 hours
- Sliding TTL on activity
- Contains: brand name, industry, logo

### 2. Project (Permanent)

Permanent project stored in **PostgreSQL**:
- Linked to user (via Auth Service)
- Created during registration
- Migrated from draft via commit flow

### 3. SiteConfig (Generated)

Structured configuration generated from draft:
- Template-based (industry-specific)
- Theme, pages, sections
- Publish-ready JSON
- Deterministic (same input → same output)

### 4. Preview (Rendered)

Safe HTML/JSON preview:
- Section type whitelist
- HTML escaping (XSS protection)
- ETag caching
- Activity tracking (TTL refresh)

## API Endpoints

### Public (Anonymous)

```bash
# Create draft
POST /api/v1/drafts
{
  "brandName": "TechCorp",
  "industry": { "code": "it_services", "label": "IT-услуги" },
  "logo": { "assetId": "ast_..." }
}
→ { draftId: "drf_...", expiresAt: "..." }

# Update draft (refreshes TTL)
PATCH /api/v1/drafts/{draft_id}
{ "brandName": "NewName" }

# Get draft
GET /api/v1/drafts/{draft_id}

# Get preview (HTML or JSON)
GET /api/v1/drafts/{draft_id}/preview?type=html
→ { preview: { type: "html", content: "...", etag: "..." } }

# Direct HTML preview
GET /p/{draft_id}
→ text/html
```

### Internal (Server-to-Server Only)

```bash
# Commit draft to permanent storage
POST /api/v1/drafts/{draft_id}/commit
X-Internal-Token: <secret>
{
  "owner": {
    "userId": "usr_...",
    "tenantId": "tnt_..."
  }
}
→ { projectId: "prj_...", configId: "cfg_...", status: "MIGRATED" }
```

## Architecture

```
API Layer (Fastify + Zod)
    ↓
Application Layer (Use Cases)
    ↓
Domain Layer (Entities, Ports)
    ↓
Infrastructure Layer (Redis, PostgreSQL, S3)
```

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for detailed architecture.

## Key Features

### 1. TTL-Based Drafts

Drafts expire automatically via Redis TTL:
- **Create:** Initial 24h TTL
- **Update:** Sliding TTL (refreshed)
- **Preview:** Sliding TTL (activity tracking)
- **Expired:** Auto-deleted by Redis

### 2. Safe Preview Rendering

Security guarantees:
- Section type whitelist (`hero`, `features`, `contact`, etc.)
- HTML escaping for all user inputs
- No arbitrary HTML/JS from users
- Built-in templates only
- Content scanning for unsafe patterns

### 3. Idempotent Commit

Safe retries via:
- Unique constraint on `draft_id`
- Redis distributed lock
- Returns existing `projectId` if already committed

### 4. Template-Based Generation

Industry-specific templates:
- `it_services` → IT Services Template
- `default` → Default Template
- Token resolution: `{{brandName}}` → escaped value
- Extensible template system

## Storage

### Redis (Temporary)

```
draft:{draftId} → JSON (SiteDraft)
  TTL: 86400 seconds (24 hours)

lock:commit:{draftId} → 1
  TTL: 30 seconds (commit lock)
```

### PostgreSQL (Permanent)

```
projects
  - project_id (PK)
  - owner_user_id
  - draft_id (UNIQUE - idempotency)
  - status

project_configs
  - config_id (PK)
  - project_id (FK)
  - config_json (JSONB)
  - config_hash (SHA256)
```

## Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development

# Redis (Drafts)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# PostgreSQL (Projects)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=configurator
POSTGRES_PASSWORD=
POSTGRES_DB=configurator_site

# Internal Auth (S2S)
INTERNAL_TOKEN=<secret>

# Draft Settings
DRAFT_TTL_SECONDS=86400

# Asset Storage
ASSET_STORAGE_TYPE=mock  # or s3
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

## Project Structure

```
src/
├── api/                 # HTTP layer (routes, controllers, DTOs)
├── application/         # Use cases (CreateDraft, CommitDraft, etc.)
├── domain/              # Entities, value objects, ports
│   ├── entities/        # SiteDraft, Project, SiteConfig
│   ├── value-objects/   # DraftId, IndustryInfo, AssetInfo
│   ├── ports/           # DraftRepository, ProjectRepository
│   └── errors/          # Domain errors
├── infrastructure/      # Adapters (Redis, PostgreSQL, S3)
├── storage/             # Repository implementations
├── config_generation/   # Template system & config generator
├── preview/             # Safe preview renderer
├── lib/                 # Utilities (slug, etag, html-escape)
└── main.ts              # Bootstrap

migrations/              # PostgreSQL migrations
docs/                    # Documentation
test/                    # Tests
```

## Documentation

- [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md) - System architecture
- [`COMMIT_FLOW.md`](./docs/COMMIT_FLOW.md) - Draft → Project migration
- [`PREVIEW_RENDERING.md`](./docs/PREVIEW_RENDERING.md) - Safe preview pipeline
- [`CONFIG_GENERATION.md`](./docs/CONFIG_GENERATION.md) - Template system
- [`API_REST.md`](./docs/API_REST.md) - REST API specification
- [`SCHEMA_MIGRATION.md`](./docs/SCHEMA_MIGRATION.md) - Schema versioning

## Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## Deployment

```bash
# Build
npm run build

# Start production
npm run start

# Health check
curl http://localhost:3000/health
```

## Monitoring

### Metrics

- `draft_created_total`
- `draft_committed_total`
- `preview_generated_total`
- `commit_duration_seconds`

### Health Endpoints

```bash
# Service health
GET /health

# Redis health
GET /health/redis

# PostgreSQL health
GET /health/postgres
```

## Security

### Public Endpoints

- No authentication required
- Anonymous draft creation
- Public preview access (drafts are ephemeral)

### Internal Endpoints

- `X-Internal-Token` header validation
- Server-to-server only (internal network)
- No direct public access

### Data Safety

- All user inputs HTML-escaped
- Section type whitelist
- No arbitrary code execution
- Privacy-preserving metadata (IP/UA hashed)

## Limitations

### Current MVP

- Mock asset storage (replace with S3)
- Single default theme per industry
- Basic template system
- No multi-language support

### By Design

- **No user authentication** - Auth is external
- **No publishing** - Separate service handles deployment
- **No domain management** - Out of scope
- **No analytics** - Tracking is external

## Contributing

1. Follow clean architecture principles
2. Keep configurator anonymous (no user context)
3. Write tests for use cases
4. Document new templates
5. Use TypeScript strict mode

## Support

- Internal docs: `docs/`
- API spec: `docs/API_REST.md`
- Architecture: `docs/ARCHITECTURE.md`

---

**Configurator Site Service** - Anonymous draft management for the site builder platform.
