# Configurator Site Service API Documentation

## Overview

The configurator_site service provides a REST API for managing website drafts with automatic TTL expiration. All endpoints are versioned under `/api/v1`.

## Base URL

```
http://localhost:3000/api/v1
```

## Response Format

All responses follow a consistent envelope format:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO8601"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO8601"
  }
}
```

## Endpoints

### 1. Create Draft

Create a new draft with TTL.

**Endpoint:** `POST /api/v1/drafts`

**Request Body:**

```json
{
  "brandName": "TechCorp",
  "industry": "tech",
  "description": "Innovative technology solutions",
  "primaryColor": "#0066FF",
  "contactEmail": "contact@techcorp.com",
  "contactPhone": "+1-234-567-8900",
  "address": "123 Tech Street, San Francisco, CA 94103",
  "socialLinks": {
    "facebook": "https://facebook.com/techcorp",
    "twitter": "https://twitter.com/techcorp",
    "instagram": "https://instagram.com/techcorp",
    "linkedin": "https://linkedin.com/company/techcorp"
  }
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "draft-uuid",
    "brandName": "TechCorp",
    "industry": "tech",
    "description": "Innovative technology solutions",
    "primaryColor": "#0066FF",
    "contactEmail": "contact@techcorp.com",
    "contactPhone": "+1-234-567-8900",
    "address": "123 Tech Street, San Francisco, CA 94103",
    "socialLinks": { ... },
    "createdAt": "2026-02-04T10:00:00.000Z",
    "expiresAt": "2026-02-05T10:00:00.000Z",
    "ttlSeconds": 86400
  },
  "meta": { ... }
}
```

### 2. Update Draft

Update draft fields and optionally refresh TTL.

**Endpoint:** `PATCH /api/v1/drafts/:id`

**Request Body:**

```json
{
  "brandName": "TechCorp Updated",
  "description": "New description",
  "refreshTtl": true
}
```

**Response:** `200 OK`

### 3. Get Draft Config

Retrieve draft configuration.

**Endpoint:** `GET /api/v1/drafts/:id/config`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "draft-uuid",
    "brandName": "TechCorp",
    "industry": "tech",
    ...
    "ttlRemaining": 82800
  }
}
```

### 4. Generate Site Config

Generate full site configuration from draft.

**Endpoint:** `GET /api/v1/drafts/:id/site-config`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "version": "1.0",
    "brandName": "TechCorp",
    "industry": "tech",
    "logoUrl": "https://...",
    "theme": {
      "name": "Tech Modern",
      "primaryColor": "#0066FF",
      "secondaryColor": "#00D4FF",
      "fontFamily": "Inter, sans-serif",
      "layout": "modern"
    },
    "pages": {
      "home": {
        "sections": [...]
      }
    },
    "metadata": {
      "title": "TechCorp - Innovative Technology Solutions",
      "description": "..."
    },
    "contact": {...},
    "social": {...},
    "generatedAt": "2026-02-04T10:00:00.000Z"
  }
}
```

### 5. Get Preview

Render preview from site configuration.

**Endpoint:** `GET /api/v1/drafts/:id/preview?format=html`

**Query Parameters:**
- `format`: `html` (default) or `json`

**Response (format=html):** `200 OK`
- Content-Type: `text/html`
- Body: Rendered HTML

**Response (format=json):** `200 OK`

```json
{
  "success": true,
  "data": {
    "format": "json",
    "config": {...},
    "previewUrl": "http://..."
  }
}
```

### 6. Upload Logo

Upload a logo for the draft.

**Endpoint:** `POST /api/v1/drafts/:id/logo`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Logo image file (JPEG, PNG, WebP, max 5MB)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "draftId": "draft-uuid",
    "logoRef": "logos/uuid.png",
    "logoUrl": "https://..."
  }
}
```

## Error Codes

- `VALIDATION_ERROR` (400): Invalid request data
- `DRAFT_NOT_FOUND` (404): Draft doesn't exist
- `DRAFT_EXPIRED` (410): Draft has expired
- `INVALID_DRAFT_DATA` (400): Invalid draft data
- `CONFIG_GENERATION_ERROR` (500): Error generating config
- `PREVIEW_RENDER_ERROR` (500): Error rendering preview
- `INTERNAL_ERROR` (500): Unexpected server error

## Industries

Supported industries:
- `tech`
- `finance`
- `healthcare`
- `retail`
- `education`
- `real-estate`
- `consulting`
- `restaurant`
- `other`

## Rate Limiting

Default: 100 requests per minute per IP.

