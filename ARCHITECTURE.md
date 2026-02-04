# Site Builder MVP - Architecture Documentation

## Project Overview

A modular, scalable site builder platform with independent microservices. The configurator service handles anonymous site creation, preview generation, and migration to permanent storage upon user registration.

## Core Principles

1. **Service Independence**: Each service is self-contained with clear API boundaries
2. **Scalability**: Designed for horizontal scaling and modular growth
3. **Clean Architecture**: Domain-driven design with clear separation of concerns
4. **API-First**: RESTful APIs enabling multiple frontend consumers

## Repository Structure

```
site_builder_MVP/
├── services/
│   └── configurator_site/          # <-- ONLY service in this directory
│       ├── src/
│       │   ├── domain/             # Business logic & entities
│       │   │   ├── entities/
│       │   │   │   ├── SiteConfig.ts
│       │   │   │   ├── DraftSite.ts
│       │   │   │   └── Asset.ts
│       │   │   ├── services/
│       │   │   │   ├── ConfigGeneratorService.ts
│       │   │   │   ├── PreviewRendererService.ts
│       │   │   │   └── MigrationService.ts
│       │   │   └── validators/
│       │   │       ├── ConfigValidator.ts
│       │   │       └── AssetValidator.ts
│       │   ├── application/         # Use cases & orchestration
│       │   │   ├── usecases/
│       │   │   │   ├── CreateDraftUseCase.ts
│       │   │   │   ├── UpdateDraftUseCase.ts
│       │   │   │   ├── GetDraftUseCase.ts
│       │   │   │   ├── GeneratePreviewUseCase.ts
│       │   │   │   ├── CommitDraftUseCase.ts
│       │   │   │   └── UploadLogoUseCase.ts
│       │   │   └── dtos/
│       │   │       ├── CreateDraftDTO.ts
│       │   │       ├── UpdateDraftDTO.ts
│       │   │       └── CommitDraftDTO.ts
│       │   ├── infrastructure/      # External adapters
│       │   │   ├── storage/
│       │   │   │   ├── interfaces/
│       │   │   │   │   ├── IDraftRepository.ts
│       │   │   │   │   ├── ISiteRepository.ts
│       │   │   │   │   └── IAssetRepository.ts
│       │   │   │   ├── repositories/
│       │   │   │   │   ├── RedisDraftRepository.ts
│       │   │   │   │   ├── PostgresSiteRepository.ts
│       │   │   │   │   └── S3AssetRepository.ts
│       │   │   │   └── models/
│       │   │   │       ├── DraftModel.ts
│       │   │   │       └── SiteModel.ts
│       │   │   ├── preview/
│       │   │   │   ├── templates/
│       │   │   │   │   └── default.ejs
│       │   │   │   └── PreviewRenderer.ts
│       │   │   ├── jobs/
│       │   │   │   └── CleanupExpiredDraftsJob.ts
│       │   │   └── config/
│       │   │       ├── database.ts
│       │   │       ├── redis.ts
│       │   │       └── storage.ts
│       │   ├── presentation/        # HTTP layer
│       │   │   ├── routes/
│       │   │   │   ├── drafts.routes.ts
│       │   │   │   └── assets.routes.ts
│       │   │   ├── controllers/
│       │   │   │   ├── DraftController.ts
│       │   │   │   └── AssetController.ts
│       │   │   ├── middleware/
│       │   │   │   ├── errorHandler.ts
│       │   │   │   ├── requestValidator.ts
│       │   │   │   └── serverAuthValidator.ts
│       │   │   └── schemas/
│       │   │       ├── draft.schema.ts
│       │   │       └── asset.schema.ts
│       │   ├── shared/
│       │   │   ├── errors/
│       │   │   │   ├── AppError.ts
│       │   │   │   ├── ValidationError.ts
│       │   │   │   └── NotFoundError.ts
│       │   │   ├── utils/
│       │   │   │   ├── logger.ts
│       │   │   │   └── idGenerator.ts
│       │   │   └── constants/
│       │   │       ├── industries.ts
│       │   │       └── config.ts
│       │   └── server.ts            # Application entry point
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── docker/
│       │   ├── Dockerfile
│       │   └── docker-compose.yml
│       ├── .env.example
│       ├── .gitignore
│       ├── package.json
│       ├── tsconfig.json
│       ├── README.md
│       └── API.md                   # API documentation
├── .gitignore
└── README.md
```

## Service Responsibilities

### Configurator Service (`services/configurator_site`)

**Owns:**

- Site configuration generation
- Anonymous draft creation & management
- Preview rendering
- Logo asset handling
- TTL-based draft cleanup
- Migration from temporary to permanent storage

**Does NOT Own:**

- User authentication/authorization
- User management
- Final site publishing infrastructure
- Domain/hosting management

## Data Models

### SiteConfig (Core Configuration Schema)

```typescript
interface SiteConfig {
  configVersion: string; // "1.0.0" - for future versioning
  brandName: string;
  industry: {
    category: string; // "Technology"
    subcategory: string; // "SaaS"
    tags: string[]; // ["B2B", "Enterprise"]
  };
  branding: {
    logo: {
      assetId: string; // Reference to uploaded asset
      url: string; // CDN/storage URL
      format: string; // "png", "svg"
      dimensions: {
        width: number;
        height: number;
      };
    };
    colors: {
      primary: string; // Auto-generated from logo or defaults
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    typography: {
      headingFont: string; // From predefined themes
      bodyFont: string;
    };
  };
  theme: {
    templateId: string; // "default", "minimal", "modern"
    style: "light" | "dark" | "auto";
  };
  pages: Page[];
  metadata: {
    generatedAt: Date;
    lastModified: Date;
  };
}

interface Page {
  id: string;
  name: string; // "home", "about", "contact"
  sections: Section[];
}

interface Section {
  id: string;
  type: string; // "hero", "features", "cta"
  content: Record<string, any>; // Flexible content per section type
  order: number;
}
```

### DraftSite (Anonymous/Temporary)

```typescript
interface DraftSite {
  draftId: string; // UUID
  config: SiteConfig;
  status: "draft" | "processing" | "ready";
  ttl: {
    createdAt: Date;
    expiresAt: Date; // createdAt + TTL duration
    lastAccessedAt: Date; // For optional TTL refresh
  };
  metadata: {
    createdFrom: "web" | "api" | "mobile";
    ipAddress?: string; // For abuse prevention
    sessionId?: string;
  };
}
```

### PublishedSite (Permanent Storage Reference)

```typescript
interface PublishedSite {
  siteId: string; // UUID
  userId: string; // From external auth system
  config: SiteConfig;
  status: "migrated" | "published" | "archived";
  ownership: {
    ownerId: string;
    createdAt: Date;
    migratedFrom?: string; // Original draftId
  };
  metadata: {
    publishedAt?: Date;
    lastUpdatedAt: Date;
  };
}
```

### Asset (Logo & Files)

```typescript
interface Asset {
  assetId: string; // UUID
  type: "logo" | "image" | "icon";
  filename: string;
  mimeType: string;
  sizeBytes: number;
  dimensions?: {
    width: number;
    height: number;
  };
  storage: {
    bucket: string;
    key: string;
    url: string; // Public/CDN URL
  };
  uploadedAt: Date;
  expiresAt?: Date; // For temporary/draft assets
}
```

## Storage Strategy

### Temporary Storage (TTL-based)

**Technology:** Redis with native TTL support

**Rationale:**

- Built-in key expiration (no manual cleanup needed)
- Fast read/write for draft operations
- Automatic memory management
- Perfect for ephemeral data

**Structure:**

```
Key: draft:{draftId}
Value: JSON serialized DraftSite
TTL: 24 hours (configurable via env)
```

**TTL Behavior:**

- Default: 24 hours from creation
- Optional: Refresh TTL on each UPDATE operation (configurable)
- On expiration: Automatic deletion by Redis
- Fallback: Optional cleanup job for orphaned references

### Permanent Storage

**Database:** PostgreSQL

- Sites table (published sites)
- Assets table (permanent logos/images)
- Ownership mapping (userId → siteId)

**Object Storage:** AWS S3 / MinIO

- Logo files
- Generated previews (optional cache)
- Static assets

### Migration Flow

```
Anonymous Draft (Redis)
    ↓
[User Registers + Auth Service Callback]
    ↓
/api/v1/drafts/:draftId/commit
    ↓
1. Validate server token from auth service
2. Read draft from Redis
3. Create PublishedSite in PostgreSQL
4. Migrate assets to permanent bucket
5. Update asset URLs in config
6. Return siteId to auth service
7. Delete draft from Redis (manual)
```

## API Contract

### Base URL: `/api/v1`

### Authentication

- **Anonymous endpoints**: No auth required for draft CRUD
- **Server-to-server**: `/commit` requires `X-Service-Token` header
- **Future**: Optional user tokens for editing published sites

### Endpoints

#### 1. Create Draft

```http
POST /api/v1/drafts
Content-Type: application/json

Request:
{
  "brandName": "Acme Corp",
  "industry": {
    "category": "Technology",
    "subcategory": "SaaS"
  },
  "logoAssetId": "uuid-from-logo-upload",
  "metadata": {
    "createdFrom": "web"
  }
}

Response: 201 Created
{
  "success": true,
  "data": {
    "draftId": "draft-uuid-123",
    "previewUrl": "/api/v1/drafts/draft-uuid-123/preview",
    "expiresAt": "2026-02-05T13:55:25Z",
    "status": "ready"
  }
}
```

#### 2. Update Draft

```http
PATCH /api/v1/drafts/:draftId
Content-Type: application/json

Request:
{
  "brandName": "New Brand Name",  // Optional
  "industry": { ... },             // Optional
  "theme": {                       // Optional
    "templateId": "minimal",
    "style": "dark"
  }
}

Response: 200 OK
{
  "success": true,
  "data": {
    "draftId": "draft-uuid-123",
    "config": { ... },              // Full updated config
    "expiresAt": "2026-02-05T13:55:25Z"
  }
}
```

#### 3. Get Draft

```http
GET /api/v1/drafts/:draftId

Response: 200 OK
{
  "success": true,
  "data": {
    "draftId": "draft-uuid-123",
    "config": { ... },
    "status": "ready",
    "ttl": {
      "expiresAt": "2026-02-05T13:55:25Z",
      "remainingSeconds": 86400
    }
  }
}
```

#### 4. Get Preview

```http
GET /api/v1/drafts/:draftId/preview
Accept: text/html | application/json

Response (HTML): 200 OK
Content-Type: text/html
<!DOCTYPE html>
<html>...</html>

Response (JSON): 200 OK
{
  "success": true,
  "data": {
    "previewHtml": "<!DOCTYPE html>...",
    "previewUrl": "https://cdn.example.com/previews/draft-uuid-123.html"
  }
}
```

#### 5. Commit Draft (Migrate to Permanent)

```http
POST /api/v1/drafts/:draftId/commit
X-Service-Token: server-secret-token
Content-Type: application/json

Request:
{
  "userId": "user-uuid-from-auth-service",
  "metadata": {
    "registrationSource": "google",
    "registeredAt": "2026-02-04T14:00:00Z"
  }
}

Response: 200 OK
{
  "success": true,
  "data": {
    "siteId": "site-uuid-456",
    "draftId": "draft-uuid-123",
    "userId": "user-uuid",
    "migratedAt": "2026-02-04T14:00:01Z",
    "editUrl": "/sites/site-uuid-456/edit"
  }
}
```

#### 6. Upload Logo

```http
POST /api/v1/assets/logo
Content-Type: multipart/form-data

Form Data:
- file: [binary]
- draftId: "draft-uuid-123" (optional, for tracking)

Response: 201 Created
{
  "success": true,
  "data": {
    "assetId": "asset-uuid-789",
    "url": "https://cdn.example.com/logos/asset-uuid-789.png",
    "filename": "logo.png",
    "mimeType": "image/png",
    "dimensions": {
      "width": 512,
      "height": 512
    },
    "sizeBytes": 45678,
    "expiresAt": "2026-02-05T13:55:25Z"
  }
}
```

### Error Response Schema

```json
{
  "success": false,
  "error": {
    "code": "DRAFT_NOT_FOUND",
    "message": "Draft with ID 'draft-uuid-123' not found or expired",
    "statusCode": 404,
    "timestamp": "2026-02-04T13:55:25Z",
    "path": "/api/v1/drafts/draft-uuid-123"
  }
}
```

### Error Codes

- `DRAFT_NOT_FOUND` - 404
- `DRAFT_EXPIRED` - 410 Gone
- `INVALID_REQUEST` - 400
- `VALIDATION_ERROR` - 422
- `ASSET_TOO_LARGE` - 413
- `UNSUPPORTED_FILE_TYPE` - 415
- `UNAUTHORIZED` - 401 (for commit endpoint)
- `INTERNAL_ERROR` - 500

## Preview Rendering

### Approach: Server-Side Template Rendering

**Technology:** EJS (Embedded JavaScript templating)

**Why:**

- Fast, synchronous rendering
- No client-side dependencies for preview
- Full control over HTML output
- Easy to cache

**Flow:**

1. Client requests `/drafts/:draftId/preview`
2. Load `DraftSite` from Redis
3. Select template based on `config.theme.templateId`
4. Render template with `config` as context
5. Return HTML or cache in S3 for CDN delivery

### Alternative: Static Preview Bundle (Future)

Generate static preview files and serve from CDN for better performance at scale.

## Scalability & Extensibility

### Versioned Config Schema

- `configVersion` field enables backward compatibility
- Migrations for config upgrades
- Legacy config transformer layer

### Pluggable Theme System

```typescript
interface IThemeTemplate {
  id: string;
  name: string;
  render(config: SiteConfig): string;
  supportedSections: string[];
}
```

### Storage Adapters

```typescript
interface IDraftRepository {
  create(draft: DraftSite): Promise<string>;
  update(id: string, updates: Partial<DraftSite>): Promise<void>;
  get(id: string): Promise<DraftSite | null>;
  delete(id: string): Promise<void>;
  refreshTTL?(id: string, seconds: number): Promise<void>;
}
```

### Industry Taxonomy

- Centralized in `shared/constants/industries.ts`
- Extensible structure
- Easy to add categories/subcategories

## Technology Stack

**Runtime:** Node.js 20+ with TypeScript

**Framework:** Fastify (lightweight, fast, excellent validation)

**Storage:**

- Redis 7+ (temporary drafts)
- PostgreSQL 15+ (permanent sites)
- MinIO/S3 (object storage)

**Validation:** Zod (type-safe schema validation)

**Templating:** EJS

**File Processing:** Sharp (image optimization)

**Jobs:** node-cron (cleanup tasks)

**Logging:** Pino (structured logging)

**Testing:** Jest + Supertest

## Environment Configuration

```env
# Server
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Redis (Temporary Storage)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
DRAFT_TTL_SECONDS=86400           # 24 hours
REFRESH_TTL_ON_UPDATE=true

# PostgreSQL (Permanent Storage)
DATABASE_URL=postgresql://user:pass@localhost:5432/sitebuilder
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Object Storage (S3/MinIO)
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET_DRAFTS=draft-assets
STORAGE_BUCKET_PERMANENT=site-assets
STORAGE_REGION=us-east-1

# Security
SERVICE_TOKEN=super-secret-token-for-server-to-server-auth
ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com

# File Upload
MAX_LOGO_SIZE_MB=5
ALLOWED_LOGO_TYPES=image/png,image/jpeg,image/svg+xml

# Preview
PREVIEW_BASE_URL=http://localhost:3000

# Cleanup Job
CLEANUP_CRON_SCHEDULE=0 */6 * * *  # Every 6 hours
```

## Deployment

### Docker Compose (Development)

Includes:

- Configurator service
- Redis
- PostgreSQL
- MinIO

### Production Considerations

- **Horizontal Scaling**: Stateless design allows multiple instances behind load balancer
- **Redis Cluster**: For high availability
- **Database Replication**: Read replicas for scaling reads
- **CDN**: CloudFront/CloudFlare for asset delivery
- **Health Checks**: `/health` endpoint for orchestrators
- **Metrics**: Prometheus-compatible `/metrics` endpoint

## Security

1. **Server-to-Server Auth**: `X-Service-Token` header validation for commit endpoint
2. **File Validation**: Strict MIME type and size checks
3. **Rate Limiting**: Per-IP limits for anonymous draft creation
4. **Input Sanitization**: All user inputs validated with Zod
5. **CORS**: Configurable allowed origins
6. **No Secrets in Config**: All sensitive data in environment variables

## Future Extensions

1. **Real-time Collaboration**: WebSocket support for live preview updates
2. **Advanced Templates**: Visual template marketplace
3. **A/B Testing**: Multiple config variants per draft
4. **Analytics**: Track draft → published conversion rates
5. **AI Enhancements**: Auto-generate content from industry/brand
6. **Export**: Download config as JSON for external use
