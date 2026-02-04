# REST API Documentation

## Overview

Anonymous, stateless REST API for managing website drafts with automatic TTL expiration.

**Base URL:** `/api/v1`

**Format:** All requests and responses use JSON

**Authentication:** None (anonymous service)

**State:** Identified by `draft_id` only

## Endpoints

### 1. Create Draft

Create a new anonymous draft.

**Endpoint:** `POST /api/v1/drafts`

**Request Body:**

```json
{
  "brandName": "ТехКорп",
  "industry": {
    "code": "tech",
    "label": "Технологии"
  },
  "logo": {
    "assetId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Fields:**
- `brandName` (required): Brand name (1-100 characters)
- `industry.code` (required): Industry code (tech, finance, healthcare, retail, education, real-estate, consulting, restaurant, other)
- `industry.label` (optional): Industry label (auto-generated if not provided)
- `logo` (optional): Logo asset reference

**Response:** `201 Created`

```json
{
  "draftId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "DRAFT",
  "expiresAt": "2026-02-05T12:00:00.000Z",
  "brandProfile": {
    "brandName": "ТехКорп",
    "industry": {
      "code": "tech",
      "label": "Технологии"
    },
    "logo": {
      "assetId": "550e8400-e29b-41d4-a716-446655440000",
      "url": "https://s3.example.com/logos/550e8400..."
    }
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/drafts \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "ТехКорп",
    "industry": {
      "code": "tech"
    }
  }'
```

---

### 2. Update Draft

Update draft fields (partial update). **TTL is refreshed** on update.

**Endpoint:** `PATCH /api/v1/drafts/:draft_id`

**Path Parameters:**
- `draft_id`: Draft UUID

**Request Body:** (all fields optional)

```json
{
  "brandName": "ТехКорп Обновленный",
  "industry": {
    "code": "finance",
    "label": "Финансы"
  },
  "logo": {
    "assetId": "new-asset-id"
  }
}
```

**Special cases:**
- Omit field: no change
- Set `logo: null`: remove logo
- Update `industry.code`: label auto-updates

**Response:** `200 OK`

```json
{
  "draftId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "DRAFT",
  "updatedAt": "2026-02-04T12:10:00.000Z",
  "expiresAt": "2026-02-05T12:10:00.000Z",
  "brandProfile": {
    "brandName": "ТехКорп Обновленный",
    "industry": {
      "code": "finance",
      "label": "Финансы"
    },
    "logo": {
      "assetId": "new-asset-id",
      "url": "https://..."
    }
  }
}
```

**Example:**

```bash
curl -X PATCH http://localhost:3000/api/v1/drafts/7c9e6679-7425-40de-944b-e07fc1f90ae7 \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "ТехКорп Новый"
  }'
```

---

### 3. Get Draft

Get current draft state.

**Endpoint:** `GET /api/v1/drafts/:draft_id`

**Path Parameters:**
- `draft_id`: Draft UUID

**Response:** `200 OK`

```json
{
  "draftId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "DRAFT",
  "createdAt": "2026-02-04T12:00:00.000Z",
  "updatedAt": "2026-02-04T12:10:00.000Z",
  "expiresAt": "2026-02-05T12:10:00.000Z",
  "brandProfile": {
    "brandName": "ТехКорп",
    "industry": {
      "code": "tech",
      "label": "Технологии"
    },
    "logo": {
      "assetId": "550e8400-...",
      "url": "https://..."
    }
  }
}
```

**Example:**

```bash
curl http://localhost:3000/api/v1/drafts/7c9e6679-7425-40de-944b-e07fc1f90ae7
```

---

### 4. Get Preview

Generate and return site preview. **TTL is refreshed** on preview request.

**Endpoint:** `GET /api/v1/drafts/:draft_id/preview`

**Path Parameters:**
- `draft_id`: Draft UUID

**Query Parameters:**
- `type`: `html` (default) or `json`

#### Option A: HTML Preview

**Request:**
```
GET /api/v1/drafts/:draft_id/preview?type=html
```

**Response:** `200 OK`

```json
{
  "draftId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "preview": {
    "type": "html",
    "content": "<!DOCTYPE html><html>...</html>",
    "generatedAt": "2026-02-04T12:15:00.000Z"
  }
}
```

#### Option B: JSON Preview Model

**Request:**
```
GET /api/v1/drafts/:draft_id/preview?type=json
```

**Response:** `200 OK`

```json
{
  "draftId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "preview": {
    "type": "json",
    "model": {
      "schemaVersion": 1,
      "title": "ТехКорп - Инновационные технологические решения",
      "theme": {
        "palette": {
          "primary": "#0066FF",
          "accent": "#00D4FF",
          "background": "#ffffff",
          "text": "#111111"
        }
      },
      "pages": [
        {
          "id": "home",
          "path": "/",
          "sections": [
            {
              "id": "hero-1",
              "type": "hero",
              "props": {
                "headline": "Добро пожаловать в ТехКорп",
                "subheadline": "Инновационные технологические решения"
              }
            }
          ]
        }
      ]
    },
    "generatedAt": "2026-02-04T12:15:00.000Z"
  }
}
```

**Example:**

```bash
# HTML preview
curl http://localhost:3000/api/v1/drafts/7c9e6679.../preview

# JSON preview
curl http://localhost:3000/api/v1/drafts/7c9e6679.../preview?type=json
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "ErrorCode",
  "message": "Human-readable message",
  "details": { }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `DraftNotFound` | 404 | Draft doesn't exist or has expired |
| `DraftExpired` | 410 | Draft has explicitly expired (TTL hit zero) |
| `InvalidInput` | 400 | Request validation failed |
| `InternalError` | 500 | Unexpected server error |

### Examples

**Draft Not Found:**
```json
{
  "error": "DraftNotFound",
  "message": "Draft with id 7c9e6679-... not found"
}
```

**Invalid Input:**
```json
{
  "error": "InvalidInput",
  "message": "Validation failed",
  "details": [
    {
      "path": ["brandName"],
      "message": "Required"
    }
  ]
}
```

---

## Industry Codes

Supported industry codes with Russian labels:

| Code | Label (Russian) | Label (English) |
|------|----------------|-----------------|
| `tech` | Технологии | Technology |
| `finance` | Финансы | Finance |
| `healthcare` | Здравоохранение | Healthcare |
| `retail` | Розничная торговля | Retail |
| `education` | Образование | Education |
| `real-estate` | Недвижимость | Real Estate |
| `consulting` | Консалтинг | Consulting |
| `restaurant` | Ресторан | Restaurant |
| `other` | Другое | Other |

---

## TTL Behavior

### Automatic Expiration

Drafts automatically expire after **24 hours** (configurable).

```
Create:  t=0    → expires at t=24h
Update:  t=12h  → expires at t=36h (refreshed)
Preview: t=20h  → expires at t=44h (refreshed)
```

### Operations That Refresh TTL

✅ **Update draft** (`PATCH /drafts/:id`) - Always refreshes
✅ **Get preview** (`GET /drafts/:id/preview`) - Always refreshes

❌ **Get draft** (`GET /drafts/:id`) - Does NOT refresh (read-only)

### After Expiration

- Draft is automatically deleted from Redis
- Any request returns `404 DraftNotFound`
- No recovery possible

---

## API Principles

### 1. Anonymous Service

- No authentication required
- No user context
- `draft_id` is the only identifier

### 2. Stateless

- Each request is independent
- State lives in Redis (draft storage)
- No session management

### 3. TTL-Based Lifecycle

- Drafts expire automatically
- No manual cleanup needed
- Active drafts stay alive (sliding TTL)

### 4. JSON Only

- All requests: `Content-Type: application/json`
- All responses: JSON format
- Preview HTML is returned as JSON string

---

## Complete Example Flow

```bash
# 1. Create draft
DRAFT_ID=$(curl -s -X POST http://localhost:3000/api/v1/drafts \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "ТехКорп",
    "industry": {"code": "tech"}
  }' | jq -r '.draftId')

echo "Created draft: $DRAFT_ID"

# 2. Update draft
curl -X PATCH http://localhost:3000/api/v1/drafts/$DRAFT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "ТехКорп Обновленный"
  }'

# 3. Get draft state
curl http://localhost:3000/api/v1/drafts/$DRAFT_ID

# 4. Get HTML preview
curl http://localhost:3000/api/v1/drafts/$DRAFT_ID/preview > preview.html

# 5. Get JSON preview
curl "http://localhost:3000/api/v1/drafts/$DRAFT_ID/preview?type=json" | jq
```

---

## Rate Limiting

Default: **100 requests per minute** per IP.

When exceeded:
```json
{
  "error": "TooManyRequests",
  "message": "Rate limit exceeded"
}
```

---

## CORS

Default: All origins allowed (`*`).

Configure via `CORS_ORIGIN` environment variable.

---

## Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "service": "configurator_site",
  "version": "0.1.0",
  "timestamp": "2026-02-04T12:00:00.000Z"
}
```

---

## OpenAPI/Swagger

OpenAPI specification available at:
```
GET /api/docs
```

(To be implemented)

