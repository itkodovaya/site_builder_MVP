# Configurator Site Service - Architecture

## Overview

The **Configurator Site Service** is an **anonymous, stateless microservice** that manages website drafts and generates site configurations. It has **zero knowledge of users or authentication** and operates on temporary TTL-based drafts.

## Core Principles

1. **Anonymous** - No user sessions, no authentication (except internal S2S)
2. **Stateless** - All state in Redis (TTL drafts) and PostgreSQL (permanent projects)
3. **Temporary First** - Drafts are temporary by default (TTL-based expiration)
4. **Server-to-Server Migration** - Commit flow is internal only
5. **Deterministic Config Generation** - Same input → same output

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                            │
│  - REST endpoints (Fastify)                                 │
│  - DTO validation (Zod)                                     │
│  - Error mapping                                            │
│  - Internal auth middleware (for commit)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  - Use Cases (orchestration)                                │
│    • CreateDraft                                            │
│    • UpdateDraft (sliding TTL)                              │
│    • GetDraft                                               │
│    • GetPreview (TTL refresh + safe rendering)              │
│    • CommitDraft (draft → project migration)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
│  - Entities: SiteDraft, BrandProfile, SiteConfig,          │
│              Project, ProjectConfig                         │
│  - Value Objects: DraftId, IndustryInfo, AssetInfo, etc.   │
│  - Ports: DraftRepository, ProjectRepository,              │
│           SiteConfigGenerator, PreviewRenderer              │
│  - Domain Errors                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                        │
│  - SiteDraftRepositoryRedis (TTL storage)                   │
│  - ProjectRepositoryPostgres (permanent storage)            │
│  - SiteConfigGeneratorImpl (template-based)                 │
│  - SafePreviewRenderer (HTML/JSON with XSS protection)      │
│  - MockAssetStorage (S3-compatible interface)               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow: Draft Lifecycle

### Phase 1: Draft Creation & Editing (Anonymous)

```
┌──────────┐
│ Frontend │ (No auth)
└─────┬────┘
      │ POST /api/v1/drafts
      │ { brandName, industry, logo }
      ↓
┌──────────────────┐
│ Configurator API │
└────────┬─────────┘
         │ CreateDraftUseCase
         ↓
    ┌────────┐
    │ Redis  │
    │ draft:{draftId} → JSON
    │ TTL: 24h
    └────────┘
         ↓
    Returns: { draftId, expiresAt }
```

### Phase 2: Preview Generation (Activity Tracking)

```
Frontend → GET /api/v1/drafts/{draftId}/preview
           ↓
    GetPreviewUseCase:
      1. Load draft from Redis
      2. Refresh TTL (activity)
      3. Generate SiteConfig (deterministic)
      4. Render preview (safe, escaped HTML)
      5. Return with ETag
           ↓
    { preview: { type: "html", content: "...", etag: "..." } }
```

### Phase 3: Registration & Commit (Server-to-Server)

```
┌──────────┐
│ Frontend │
└─────┬────┘
      │ POST /auth/register
      │ { email, password, draftId }
      ↓
┌──────────────┐
│ Auth Service │
└──────┬───────┘
       │ 1. Create user → userId
       │ 2. Call Configurator (internal)
       │
       │ POST /api/v1/drafts/{draftId}/commit
       │ X-Internal-Token: <secret>
       │ { owner: { userId } }
       ↓
┌────────────────────┐
│ Configurator       │
│ CommitDraftUseCase │
└─────────┬──────────┘
          │ 1. Load draft (Redis)
          │ 2. Generate SiteConfig
          │ 3. Save to PostgreSQL (transaction)
          │    - projects table
          │    - project_configs table
          │ 4. Delete from Redis
          ↓
     ┌──────────┐
     │ Postgres │
     │ projects
     │ project_configs
     └──────────┘
          ↓
    Returns: { projectId, configId, status: "MIGRATED" }
```

## Storage Architecture

### Redis (Temporary Storage)

**Purpose:** TTL-based draft storage

**Key Structure:**
```
draft:{draftId} → JSON (SiteDraft)
  TTL: 86400 seconds (24 hours)

lock:commit:{draftId} → 1
  TTL: 30 seconds (commit lock)
```

**TTL Strategy:**
- **Create:** Initial TTL set
- **Update:** Sliding TTL (refreshed)
- **Preview:** Sliding TTL (activity tracking)
- **Read:** No TTL refresh (optional)

**Expiration:** Automatic via Redis TTL

### PostgreSQL (Permanent Storage)

**Purpose:** Permanent projects and configurations

**Tables:**

**`projects`**
```sql
project_id (PK)
owner_user_id (opaque external ID)
owner_tenant_id (optional)
draft_id (UNIQUE - idempotency key)
created_at, updated_at
status (DRAFT/READY/PUBLISHED/ARCHIVED)
```

**`project_configs`**
```sql
config_id (PK)
project_id (FK → projects)
schema_version, config_version
template_id, template_version
config_json (JSONB)
config_hash (SHA256)
created_at
```

**Idempotency:** Unique constraint on `draft_id` prevents duplicate commits

## Config Generation Pipeline

### 1. Input (from Draft)

```typescript
{
  brandName: "TechCorp",
  industry: { code: "it_services", label: "IT-услуги" },
  logo: { assetId: "ast_...", url: "..." }
}
```

### 2. Template Selection

```typescript
templateId = TemplateRegistry.getByIndustry(industry.code)
// it_services → ITServicesTemplate
// default → DefaultTemplate
```

### 3. Config Generation

```typescript
SiteConfig = {
  schemaVersion: 1,
  configVersion: "1.0.0",
  configId: "cfg_...",
  draftId: "drf_...",
  
  generator: {
    engine: "configurator_site",
    engineVersion: "0.1.0",
    templateId: "it_services",
    templateVersion: 1
  },
  
  brand: {
    name: "TechCorp",
    slug: "techcorp",
    industry: { ... },
    logo: { ... }
  },
  
  theme: {
    themeId: "it_services_default",
    palette: { primary: "#025add", ... },
    typography: { ... },
    radius: "md",
    spacing: "md"
  },
  
  pages: [
    {
      id: "home",
      path: "/",
      sections: [
        {
          id: "hero_1",
          type: "hero",
          props: {
            headline: "TechCorp — IT-услуги для роста бизнеса",
            // Token resolution: {{brandName}} → "TechCorp"
            ...
          }
        },
        ...
      ]
    }
  ],
  
  assets: [ ... ],
  publishing: { ... }
}
```

### 4. Token Resolution

```typescript
// Template tokens
{{brandName}} → "TechCorp"
{{industryLabel}} → "IT-услуги"
{{logoUrl}} → "https://cdn.example.com/..."

// All values HTML-escaped for safety
```

## Preview Rendering (Security)

### Safe Rendering Pipeline

```
SiteConfig (structured data)
    ↓
SafePreviewRenderer:
  1. Section Type Whitelist ✅
     - Only allowed: hero, features, contact, etc.
     - Unknown types → skipped
     
  2. HTML Escaping ✅
     - All user inputs escaped
     - <script> → &lt;script&gt;
     
  3. Built-in Templates ✅
     - Predefined HTML templates
     - No arbitrary HTML from users
     
  4. Content Scanning ✅
     - Detect <script>, <iframe>, javascript:
     - Block unsafe content
    ↓
HTML Preview (safe for display)
```

### Security Guarantees

- ✅ No XSS attacks
- ✅ No arbitrary code execution
- ✅ No user-supplied HTML/JS
- ✅ All strings escaped
- ✅ Section type whitelist

## API Endpoints

### Public (Anonymous)

```
POST   /api/v1/drafts
PATCH  /api/v1/drafts/{draft_id}
GET    /api/v1/drafts/{draft_id}
GET    /api/v1/drafts/{draft_id}/preview
GET    /p/{draft_id}  (direct HTML)
```

### Internal (Server-to-Server Only)

```
POST   /api/v1/drafts/{draft_id}/commit
  Header: X-Internal-Token: <secret>
  Body: { owner: { userId, tenantId } }
```

**Authentication:** `X-Internal-Token` validation or mTLS

## Error Handling

| Error | HTTP | Retry? | Action |
|-------|------|--------|--------|
| `DraftNotFound` | 404 | No | Draft expired - recreate |
| `DraftExpired` | 410 | No | Same as NotFound |
| `DraftAlreadyCommitted` | 200* | Yes | Idempotent - return projectId |
| `CommitInProgress` | 409 | Yes | Wait & retry |
| `CommitLockError` | 409 | Yes | Wait & retry |
| `AssetNotFound` | 404 | No | Invalid asset reference |
| `Unauthorized` | 401 | No | Invalid internal token |

*Note: `DraftAlreadyCommitted` returns 200 (not error) for idempotency

## Idempotency & Concurrency

### Commit Idempotency

**Mechanism 1: Redis Lock**
```
SET lock:commit:{draftId} 1 NX EX 30
```
Prevents concurrent commits.

**Mechanism 2: DB Unique Constraint**
```sql
CONSTRAINT projects_draft_id_unique UNIQUE (draft_id)
```
Prevents duplicate projects from same draft.

**Mechanism 3: Idempotency Check**
```typescript
const existingProject = await repo.findProjectByDraftId(draftId);
if (existingProject) {
  return { projectId, status: "ALREADY_COMMITTED" };
}
```

### Result: Safe Retries

```
Attempt 1: SUCCESS → 201 Created { projectId: "prj_abc" }
Attempt 2: IDEMPOTENT → 200 OK { projectId: "prj_abc", status: "ALREADY_COMMITTED" }
Attempt 3: IDEMPOTENT → 200 OK { projectId: "prj_abc", status: "ALREADY_COMMITTED" }
```

## Scalability Considerations

### Horizontal Scaling

✅ **Stateless** - No in-memory sessions
✅ **Redis for Coordination** - Distributed locks
✅ **DB Transactions** - ACID guarantees
✅ **No File System Dependencies** - S3 for assets

### Performance Optimization

1. **ETag Caching** - Preview responses cached by client
2. **Redis Pipeline** - Batch Redis commands
3. **DB Connection Pooling** - Reuse connections
4. **Template Preloading** - Load templates on startup
5. **JSONB Indexes** - Fast config queries

### Monitoring

**Metrics:**
- `draft_created_total`
- `draft_committed_total`
- `preview_generated_total`
- `commit_duration_seconds`
- `redis_ttl_refreshes_total`

**Logs:**
- Draft lifecycle events
- Commit attempts & results
- Lock conflicts
- DB transaction durations

## Deployment Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Load Balancer                      │
└────────────────────┬─────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ↓                         ↓
┌───────────────┐         ┌───────────────┐
│ Configurator  │         │ Configurator  │
│ Instance 1    │         │ Instance 2    │
└───────┬───────┘         └───────┬───────┘
        │                         │
        └────────────┬────────────┘
                     ↓
        ┌────────────────────────┐
        │       Redis            │
        │  (Cluster or Sentinel) │
        └────────────────────────┘
                     ↓
        ┌────────────────────────┐
        │     PostgreSQL         │
        │  (Primary + Replicas)  │
        └────────────────────────┘
                     ↓
        ┌────────────────────────┐
        │         S3             │
        │  (Asset Storage)       │
        └────────────────────────┘
```

## Service Boundaries

### What Configurator Does

✅ Manage anonymous drafts (TTL-based)
✅ Generate site configurations (template-based)
✅ Render safe previews (HTML/JSON)
✅ Commit drafts to permanent storage (S2S)
✅ Store projects and configs (PostgreSQL)

### What Configurator Does NOT Do

❌ User authentication
❌ User sessions
❌ User management
❌ Publishing to production
❌ Domain registration
❌ SSL certificates
❌ Analytics tracking

**Configurator is purely a config generator and draft manager!**

## Future Extensibility

### Phase 2: Enhanced Features

- **Asset Management** - Replace MockAssetStorage with S3
- **Custom Themes** - User-defined color palettes
- **Section Customization** - Edit section props directly
- **Multi-language** - Locale-specific templates
- **AI Enhancement** - Generated headlines/copy

### Phase 3: Advanced Workflows

- **Version History** - Track config changes
- **A/B Testing** - Multiple configs per project
- **Collaboration** - Multi-user editing (with auth service)
- **Export** - Static site generation
- **Webhooks** - Notify external services

## Summary

The Configurator Site Service is:

🎯 **Purpose-Built** - Anonymous draft management only
🔒 **Secure** - Safe preview rendering, S2S authentication
⚡ **Fast** - TTL-based expiration, ETag caching
🔄 **Reliable** - Idempotent commits, distributed locks
📦 **Self-Contained** - No external auth dependencies
🚀 **Scalable** - Stateless, horizontally scalable

**The service operates entirely on draft IDs and project IDs - no user context ever flows through it!**
