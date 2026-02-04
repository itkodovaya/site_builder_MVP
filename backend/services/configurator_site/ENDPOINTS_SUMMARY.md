# API Endpoints Summary

Quick reference for all available endpoints in the configurator_site service.

## Base URL

```
http://localhost:3000/api/v1
```

## Endpoints

### 1. Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "configurator_site",
  "timestamp": "2026-02-04T10:00:00.000Z"
}
```

---

### 2. Create Draft

```
POST /api/v1/drafts
```

**Request Body:**
```json
{
  "brandName": "string (required, 1-100 chars)",
  "industry": "tech|finance|healthcare|retail|education|real-estate|consulting|restaurant|other (required)",
  "description": "string (optional, max 1000 chars)",
  "primaryColor": "string (optional, hex color)",
  "contactEmail": "string (optional, email)",
  "contactPhone": "string (optional, max 50 chars)",
  "address": "string (optional, max 500 chars)",
  "socialLinks": {
    "facebook": "string (optional, URL)",
    "twitter": "string (optional, URL)",
    "instagram": "string (optional, URL)",
    "linkedin": "string (optional, URL)"
  }
}
```

**Response:** `201 Created`

---

### 3. Update Draft

```
PATCH /api/v1/drafts/:id
```

**Request Body:** (all fields optional)
```json
{
  "brandName": "string",
  "industry": "string",
  "description": "string",
  "primaryColor": "string",
  "contactEmail": "string",
  "contactPhone": "string",
  "address": "string",
  "socialLinks": {...},
  "refreshTtl": "boolean (true to refresh expiration)"
}
```

**Response:** `200 OK`

---

### 4. Get Draft Configuration

```
GET /api/v1/drafts/:id/config
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "brandName": "string",
    "industry": "string",
    "logoRef": "string|null",
    "description": "string|undefined",
    "primaryColor": "string|undefined",
    "contactEmail": "string|undefined",
    "contactPhone": "string|undefined",
    "address": "string|undefined",
    "socialLinks": {...},
    "createdAt": "ISO8601",
    "expiresAt": "ISO8601",
    "updatedAt": "ISO8601|undefined",
    "ttlRemaining": "number|null (seconds)"
  }
}
```

---

### 5. Generate Site Configuration

```
GET /api/v1/drafts/:id/site-config
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "version": "1.0",
    "brandName": "string",
    "industry": "string",
    "logoUrl": "string|null",
    "theme": {
      "name": "string",
      "primaryColor": "string",
      "secondaryColor": "string",
      "fontFamily": "string",
      "layout": "modern|classic|minimal"
    },
    "pages": {
      "home": {
        "sections": [...]
      }
    },
    "metadata": {
      "title": "string",
      "description": "string"
    },
    "contact": {...},
    "social": {...},
    "generatedAt": "ISO8601"
  }
}
```

---

### 6. Get Preview

```
GET /api/v1/drafts/:id/preview?format=html|json
```

**Query Parameters:**
- `format`: `html` (default) or `json`

**Response (format=html):** `200 OK`
- Content-Type: `text/html`
- Body: Rendered HTML preview

**Response (format=json):** `200 OK`
```json
{
  "success": true,
  "data": {
    "format": "json",
    "config": {...},
    "previewUrl": "string|undefined"
  }
}
```

---

### 7. Upload Logo

```
POST /api/v1/drafts/:id/logo
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Image file (JPEG, PNG, WebP)
- Max size: 5MB

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "draftId": "uuid",
    "logoRef": "string",
    "logoUrl": "string"
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {...}
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO8601"
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `INVALID_DRAFT_DATA` | 400 | Invalid draft data |
| `DRAFT_NOT_FOUND` | 404 | Draft doesn't exist |
| `DRAFT_EXPIRED` | 410 | Draft has expired |
| `CONFIG_GENERATION_ERROR` | 500 | Config generation failed |
| `PREVIEW_RENDER_ERROR` | 500 | Preview rendering failed |
| `INTERNAL_ERROR` | 500 | Unexpected error |

---

## Examples

### Complete Flow

```bash
# 1. Create draft
DRAFT_ID=$(curl -s -X POST http://localhost:3000/api/v1/drafts \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "TechCorp",
    "industry": "tech",
    "description": "Innovative solutions",
    "primaryColor": "#0066FF",
    "contactEmail": "info@techcorp.com"
  }' | jq -r '.data.id')

# 2. Upload logo
curl -X POST http://localhost:3000/api/v1/drafts/$DRAFT_ID/logo \
  -F "file=@logo.png"

# 3. Update draft
curl -X PATCH http://localhost:3000/api/v1/drafts/$DRAFT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "refreshTtl": true
  }'

# 4. Get preview HTML
curl http://localhost:3000/api/v1/drafts/$DRAFT_ID/preview > preview.html

# 5. Get preview JSON
curl http://localhost:3000/api/v1/drafts/$DRAFT_ID/preview?format=json

# 6. Get site config
curl http://localhost:3000/api/v1/drafts/$DRAFT_ID/site-config
```

### Test with httpie

```bash
# Create draft
http POST localhost:3000/api/v1/drafts \
  brandName="TechCorp" \
  industry="tech"

# Get preview
http localhost:3000/api/v1/drafts/{id}/preview format==html

# Upload logo
http -f POST localhost:3000/api/v1/drafts/{id}/logo \
  file@logo.png
```

---

## Rate Limiting

Default: **100 requests per minute** per IP address.

Returns `429 Too Many Requests` when exceeded.

---

## CORS

Default: All origins allowed (`*`).

Configure via `CORS_ORIGIN` environment variable.

