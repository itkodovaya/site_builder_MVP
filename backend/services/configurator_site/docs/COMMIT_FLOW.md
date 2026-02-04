# Draft → Project Migration Flow

## Overview

The **commit flow** migrates a temporary TTL-based draft from Redis to permanent storage in PostgreSQL. This operation is **server-to-server only** and requires internal authentication.

## Actors

| Actor | Responsibility |
|-------|----------------|
| **Auth/User Service** | Handles user registration, triggers commit |
| **Configurator Site Service** | Manages drafts, generates configs, commits to DB |
| **Redis** | Stores temporary drafts with TTL |
| **PostgreSQL** | Stores permanent projects and configs |

## High-Level Flow

```
1. User registers (Auth Service)
   ↓
2. Auth Service calls Configurator commit endpoint
   POST /api/v1/drafts/{draftId}/commit
   Header: X-Internal-Token: <secret>
   Body: { owner: { userId, tenantId } }
   ↓
3. Configurator migrates draft → project
   - Load draft from Redis
   - Generate SiteConfig
   - Save to PostgreSQL (transaction)
   - Delete from Redis
   ↓
4. Return projectId to Auth Service
   { projectId, configId, status: "MIGRATED" }
```

## Detailed Steps

### 1. User Registration (Auth Service)

User completes registration form and submits with `draftId`:

```json
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "...",
  "draftId": "drf_01HTZK7Q9P8K5M2V1R6A3C9D2E"
}
```

Auth Service:
1. Validates credentials
2. Creates user account → `userId`
3. Prepares to commit draft

### 2. Server-to-Server Commit Call

Auth Service calls Configurator (internal):

```http
POST /api/v1/drafts/drf_01HTZK7Q9P8K5M2V1R6A3C9D2E/commit
Host: configurator-service:3000
X-Internal-Token: <secret-token>
Content-Type: application/json

{
  "owner": {
    "userId": "usr_01HTZK8R5G3N9Q7N0B2F1D4A8C",
    "tenantId": "tnt_default"
  }
}
```

**Authentication Methods:**

**Option A: X-Internal-Token Header** (Recommended for MVP)
```typescript
// Configurator validates token
if (request.headers['x-internal-token'] !== process.env.INTERNAL_TOKEN) {
  return 401 Unauthorized
}
```

**Option B: mTLS** (Production-grade)
- Client certificate validation
- Whitelist of trusted service certificates
- No shared secrets

### 3. Migration Steps (Inside Configurator)

#### Step A: Acquire Lock

Prevent concurrent commits (race condition protection):

```typescript
// Redis lock
SET lock:commit:{draftId} 1 NX EX 30

if (result !== 'OK') {
  return 409 Conflict "Commit already in progress"
}
```

#### Step B: Check Idempotency

Has this draft already been committed?

```sql
SELECT project_id FROM projects WHERE draft_id = $1
```

If exists:
```json
{
  "draftId": "drf_...",
  "projectId": "prj_...",
  "status": "ALREADY_COMMITTED"
}
```

**Important:** Returns existing `projectId` - safe for retries!

#### Step C: Load Draft from Redis

```typescript
GET draft:{draftId}
```

If missing:
```json
{
  "error": "DraftNotFound",
  "message": "Draft has expired or does not exist"
}
```

#### Step D: Generate Publish-Ready SiteConfig

```typescript
const siteConfig = await configGenerator.generate(draft);
```

**Output includes:**
- `schemaVersion` - JSON schema version
- `configVersion` - Semantic config version (e.g., "1.0.0")
- `templateId` + `templateVersion` - Template used
- `generatedAt` - Timestamp
- Complete `brand`, `theme`, `site`, `pages`, `assets`

#### Step E: Persist to DB (Transaction)

```sql
BEGIN;

-- Insert project
INSERT INTO projects (
  project_id,
  owner_user_id,
  owner_tenant_id,
  draft_id,
  status
) VALUES (
  'prj_01...',
  'usr_01...',
  'tnt_default',
  'drf_01...',
  'DRAFT'
);

-- Insert config
INSERT INTO project_configs (
  config_id,
  project_id,
  schema_version,
  config_version,
  template_id,
  template_version,
  config_json,
  config_hash
) VALUES (
  'cfg_01...',
  'prj_01...',
  1,
  '1.0.0',
  'it_services',
  1,
  '{"schemaVersion": 1, ...}',
  'abc123...'
);

COMMIT;
```

**Unique Constraint on `draft_id`:**
```sql
CONSTRAINT projects_draft_id_unique UNIQUE (draft_id)
```

If constraint violated → draft already committed (idempotency)

#### Step F: Delete Draft from Redis

```typescript
DEL draft:{draftId}
```

**Note:** Non-critical - draft will expire naturally via TTL if delete fails.

#### Step G: Release Lock

```typescript
DEL lock:commit:{draftId}
```

#### Step H: Return Response

```json
{
  "draftId": "drf_01HTZK7Q9P8K5M2V1R6A3C9D2E",
  "projectId": "prj_01HTZK8S6H4P0R8O2C3E5G7I9K",
  "configId": "cfg_01HTZK8T7J5Q1S9P3D4F6H8J0L",
  "status": "MIGRATED",
  "project": {
    "projectId": "prj_...",
    "owner": { "userId": "usr_...", "tenantId": "tnt_..." },
    "createdAt": "2026-02-04T14:30:00.000Z",
    "status": "DRAFT"
  },
  "config": {
    "configId": "cfg_...",
    "schemaVersion": 1,
    "configVersion": "1.0.0",
    "templateId": "it_services"
  }
}
```

## Error Handling

### Draft Not Found (404)

**Cause:** Draft expired or never existed

**Response:**
```json
{
  "error": "DraftNotFound",
  "message": "Draft with id drf_... not found"
}
```

**Action:** Auth service should prompt user to recreate draft

### Draft Already Committed (200 - Idempotent)

**Cause:** Retry of successful commit

**Response:**
```json
{
  "draftId": "drf_...",
  "projectId": "prj_...",
  "status": "ALREADY_COMMITTED"
}
```

**Action:** Auth service accepts `projectId` - **no error!**

### Commit In Progress (409)

**Cause:** Concurrent commit attempt

**Response:**
```json
{
  "error": "CommitInProgress",
  "message": "Draft is currently being committed"
}
```

**Action:** Auth service should retry after 1-2 seconds

### Unauthorized (401)

**Cause:** Missing or invalid `X-Internal-Token`

**Response:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid internal authentication token"
}
```

**Action:** Check service configuration

## Idempotency Guarantees

### Why Idempotency Matters

Network issues, timeouts, or retries can cause duplicate commit requests. The system must handle this safely.

### Implementation

**1. Unique Constraint (Primary)**
```sql
CONSTRAINT projects_draft_id_unique UNIQUE (draft_id)
```

If draft already committed, DB rejects duplicate:
- Transaction rolls back
- Use case checks for existing project
- Returns existing `projectId`

**2. Idempotency-Key Header (Optional)**
```http
POST /api/v1/drafts/{draftId}/commit
Idempotency-Key: reg_abc123def456
```

Configurator can cache result by key for 24 hours:
```
SET idempotency:reg_abc123def456 <result> EX 86400
```

**3. Redis Lock (Race Protection)**
```
SET lock:commit:{draftId} 1 NX EX 30
```

Prevents two commits from running simultaneously.

### Result: Safe Retries ✅

```
Attempt 1: Create project → Success → 201 Created
Attempt 2 (retry): Check DB → Already exists → 200 OK (same projectId)
Attempt 3 (retry): Check DB → Already exists → 200 OK (same projectId)
```

## Database Schema

### `projects` Table

| Column | Type | Description |
|--------|------|-------------|
| `project_id` | VARCHAR(50) PK | Unique project identifier |
| `owner_user_id` | VARCHAR(100) | External user ID (opaque) |
| `owner_tenant_id` | VARCHAR(100) | External tenant ID (optional) |
| `draft_id` | VARCHAR(50) UNIQUE | Original draft ID (idempotency key) |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |
| `status` | VARCHAR(20) | DRAFT/READY/PUBLISHED/ARCHIVED |

**Indexes:**
- `projects_draft_id_unique` (UNIQUE) - Idempotency
- `idx_projects_owner_user_id` - Query by owner
- `idx_projects_created_at` - Sort by date

### `project_configs` Table

| Column | Type | Description |
|--------|------|-------------|
| `config_id` | VARCHAR(50) PK | Unique config identifier |
| `project_id` | VARCHAR(50) FK | Parent project |
| `schema_version` | INTEGER | JSON schema version |
| `config_version` | VARCHAR(20) | Semantic config version |
| `template_id` | VARCHAR(50) | Template used |
| `template_version` | INTEGER | Template version |
| `config_json` | JSONB | Full SiteConfig |
| `config_hash` | VARCHAR(64) | SHA256 of config_json |
| `created_at` | TIMESTAMP | Creation time |

**Indexes:**
- `idx_project_configs_project_id` - Query by project
- `idx_project_configs_config_hash` - Deduplication
- `idx_project_configs_config_json` (GIN) - JSONB queries

## Security Considerations

### No User Authentication

Configurator **does not** authenticate end users. It only:
- Validates server-to-server calls (internal token)
- Accepts `userId` as opaque external ID
- Never validates user permissions

### Trusted Internal Calls Only

**Production Setup:**
1. Internal network only (no public access to commit endpoint)
2. mTLS between services
3. Rotate `X-Internal-Token` regularly
4. Log all commit attempts

### Data Isolation

Configurator stores `owner_user_id` but:
- Never queries user service
- Never exposes user data
- Projects isolated by `owner_user_id` (when querying later)

## Example: Complete Registration Flow

```typescript
// 1. Frontend: Create draft
POST /api/v1/drafts
{
  "brandName": "TechCorp",
  "industry": { "code": "it_services", "label": "IT-услуги" },
  "logo": { "assetId": "ast_..." }
}
→ { draftId: "drf_abc123" }

// 2. Frontend: User registers with draftId
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "...",
  "draftId": "drf_abc123"
}

// 3. Auth Service: Create user
userId = createUser(email, password)
→ userId: "usr_xyz789"

// 4. Auth Service → Configurator: Commit draft (internal)
POST http://configurator:3000/api/v1/drafts/drf_abc123/commit
X-Internal-Token: <secret>
{
  "owner": {
    "userId": "usr_xyz789",
    "tenantId": "tnt_default"
  }
}
→ { projectId: "prj_def456", status: "MIGRATED" }

// 5. Auth Service: Link project to user
linkProjectToUser(userId, projectId)

// 6. Auth Service → Frontend: Registration complete
{
  "userId": "usr_xyz789",
  "projectId": "prj_def456",
  "redirectTo": "/dashboard"
}
```

## Testing Idempotency

```bash
# Commit draft
curl -X POST http://localhost:3000/api/v1/drafts/drf_test/commit \
  -H "X-Internal-Token: secret" \
  -H "Content-Type: application/json" \
  -d '{"owner":{"userId":"usr_test"}}'

# Response: 201 Created
{
  "projectId": "prj_abc",
  "status": "MIGRATED"
}

# Retry commit (same draftId)
curl -X POST http://localhost:3000/api/v1/drafts/drf_test/commit \
  -H "X-Internal-Token: secret" \
  -H "Content-Type: application/json" \
  -d '{"owner":{"userId":"usr_test"}}'

# Response: 200 OK (idempotent)
{
  "projectId": "prj_abc",
  "status": "ALREADY_COMMITTED"
}
```

## Monitoring & Observability

### Metrics to Track

- `commit_attempts_total` - Total commit requests
- `commit_success_total` - Successful migrations
- `commit_idempotent_total` - Idempotent retries
- `commit_lock_conflicts_total` - Concurrent attempts
- `commit_duration_seconds` - Latency

### Logs to Capture

```json
{
  "event": "draft_commit_started",
  "draftId": "drf_...",
  "userId": "usr_...",
  "timestamp": "2026-02-04T14:30:00Z"
}

{
  "event": "draft_commit_completed",
  "draftId": "drf_...",
  "projectId": "prj_...",
  "duration_ms": 245,
  "status": "MIGRATED"
}
```

### Alerts

- **High Lock Conflicts** - Indicates concurrent commit issues
- **Commit Failures** - Database or Redis connectivity problems
- **Slow Commits** - Performance degradation

## Summary

The commit flow ensures:
✅ **Atomicity** - Transaction guarantees all-or-nothing
✅ **Idempotency** - Safe retries via unique constraint
✅ **Consistency** - Lock prevents race conditions
✅ **Security** - Internal-only, token-authenticated
✅ **Observability** - Comprehensive logging & metrics

The configurator remains **stateless and anonymous** - it knows only drafts and projects, never user sessions!

