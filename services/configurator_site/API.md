# Configurator Service API Specification

Version: 1.0.0  
Base URL: `/api/v1`  
Protocol: HTTP/1.1, HTTPS

---

## Table of Contents

1. [Authentication](#authentication)
2. [Request/Response Format](#requestresponse-format)
3. [Endpoints](#endpoints)
   - [Drafts](#drafts)
   - [Assets](#assets)
   - [Health](#health)
4. [Data Schemas](#data-schemas)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## Authentication

### Anonymous Endpoints

All draft creation and update endpoints are **anonymous-accessible** to support the MVP flow:

- `POST /api/v1/drafts`
- `PATCH /api/v1/drafts/:draftId`
- `GET /api/v1/drafts/:draftId`
- `GET /api/v1/drafts/:draftId/preview`
- `POST /api/v1/assets/logo`

### Server-to-Server Endpoints

These endpoints require a service token for security:

- `POST /api/v1/drafts/:draftId/commit`

**Header:**

```
X-Service-Token: <your_service_token>
```

**Error Response** (if missing/invalid):

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid service token",
    "statusCode": 401
  }
}
```

---

## Request/Response Format

### Standard Response Envelope

All responses follow this structure:

**Success:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "statusCode": 400,
    "timestamp": "2026-02-04T13:55:25.000Z",
    "path": "/api/v1/drafts/123",
    "details": { ... }  // Optional additional context
  }
}
```

### Content Types

- Request: `application/json` (except file uploads: `multipart/form-data`)
- Response: `application/json` or `text/html` (for preview endpoint)

---

## Endpoints

### Drafts

#### Create Draft

Create a new anonymous draft site configuration.

**Endpoint:** `POST /api/v1/drafts`

**Request Body:**

```json
{
  "brandName": "Acme Corporation",
  "industry": {
    "category": "Technology",
    "subcategory": "SaaS",
    "tags": ["B2B", "Enterprise"] // Optional
  },
  "logoAssetId": "550e8400-e29b-41d4-a716-446655440000", // From prior logo upload
  "theme": {
    // Optional
    "templateId": "default", // default, minimal, modern
    "style": "light" // light, dark, auto
  },
  "metadata": {
    // Optional
    "createdFrom": "web" // web, api, mobile
  }
}
```

**Validation Rules:**

- `brandName`: 1-100 characters, required
- `industry.category`: Must match taxonomy, required
- `industry.subcategory`: Must match category's subcategories, required
- `logoAssetId`: Must be a valid UUID of an existing asset

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "draftId": "draft-550e8400-e29b-41d4-a716-446655440000",
    "previewUrl": "/api/v1/drafts/draft-550e8400-e29b-41d4-a716-446655440000/preview",
    "config": {
      "configVersion": "1.0.0",
      "brandName": "Acme Corporation",
      "industry": {
        "category": "Technology",
        "subcategory": "SaaS",
        "tags": ["B2B", "Enterprise"]
      },
      "branding": {
        "logo": {
          "assetId": "550e8400-e29b-41d4-a716-446655440000",
          "url": "https://cdn.example.com/logos/550e8400.png",
          "format": "png",
          "dimensions": { "width": 512, "height": 512 }
        },
        "colors": {
          "primary": "#2563eb",
          "secondary": "#7c3aed",
          "accent": "#f59e0b",
          "background": "#ffffff",
          "text": "#1f2937"
        },
        "typography": {
          "headingFont": "Inter",
          "bodyFont": "Inter"
        }
      },
      "theme": {
        "templateId": "default",
        "style": "light"
      },
      "pages": [
        {
          "id": "home",
          "name": "home",
          "sections": [
            {
              "id": "hero-1",
              "type": "hero",
              "order": 1,
              "content": {
                "headline": "Welcome to Acme Corporation",
                "subheadline": "Technology solutions for modern businesses"
              }
            }
          ]
        }
      ],
      "metadata": {
        "generatedAt": "2026-02-04T13:55:25.000Z",
        "lastModified": "2026-02-04T13:55:25.000Z"
      }
    },
    "status": "ready",
    "ttl": {
      "createdAt": "2026-02-04T13:55:25.000Z",
      "expiresAt": "2026-02-05T13:55:25.000Z",
      "remainingSeconds": 86400
    }
  }
}
```

**Errors:**

- `400 VALIDATION_ERROR`: Invalid request body
- `404 ASSET_NOT_FOUND`: logoAssetId doesn't exist or expired
- `422 INVALID_INDUSTRY`: Industry category/subcategory not in taxonomy

---

#### Update Draft

Update an existing draft configuration.

**Endpoint:** `PATCH /api/v1/drafts/:draftId`

**Path Parameters:**

- `draftId` (string, UUID): Draft identifier

**Request Body** (all fields optional):

```json
{
  "brandName": "New Acme Corp",
  "industry": {
    "category": "E-commerce",
    "subcategory": "Fashion"
  },
  "theme": {
    "templateId": "minimal",
    "style": "dark"
  },
  "pages": [
    {
      "id": "home",
      "name": "home",
      "sections": [
        {
          "id": "hero-1",
          "type": "hero",
          "order": 1,
          "content": {
            "headline": "Custom Headline"
          }
        }
      ]
    }
  ]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "draftId": "draft-550e8400-e29b-41d4-a716-446655440000",
    "config": { ... },  // Full updated config
    "ttl": {
      "expiresAt": "2026-02-05T13:55:25.000Z",  // Refreshed if configured
      "remainingSeconds": 86400
    }
  }
}
```

**Errors:**

- `404 DRAFT_NOT_FOUND`: Draft doesn't exist
- `410 DRAFT_EXPIRED`: Draft TTL expired
- `400 VALIDATION_ERROR`: Invalid update data

---

#### Get Draft

Retrieve draft configuration and status.

**Endpoint:** `GET /api/v1/drafts/:draftId`

**Path Parameters:**

- `draftId` (string, UUID): Draft identifier

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "draftId": "draft-550e8400-e29b-41d4-a716-446655440000",
    "config": { ... },  // Full SiteConfig
    "status": "ready",  // draft | processing | ready
    "ttl": {
      "createdAt": "2026-02-04T13:55:25.000Z",
      "expiresAt": "2026-02-05T13:55:25.000Z",
      "remainingSeconds": 43200
    },
    "metadata": {
      "createdFrom": "web",
      "sessionId": "sess-123"
    }
  }
}
```

**Errors:**

- `404 DRAFT_NOT_FOUND`: Draft doesn't exist
- `410 DRAFT_EXPIRED`: Draft TTL expired

---

#### Get Preview

Render HTML preview or return preview data.

**Endpoint:** `GET /api/v1/drafts/:draftId/preview`

**Path Parameters:**

- `draftId` (string, UUID): Draft identifier

**Query Parameters:**

- `format` (optional): `html` (default) or `json`

**Request Headers:**

```
Accept: text/html              # For HTML response
Accept: application/json       # For JSON response
```

**Response (HTML):** `200 OK`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Acme Corporation</title>
    <style>
      /* Generated styles from theme */
    </style>
  </head>
  <body>
    <!-- Rendered sections based on config -->
    <header>
      <img
        src="https://cdn.example.com/logos/550e8400.png"
        alt="Acme Corporation"
      />
    </header>
    <main>
      <section class="hero">
        <h1>Welcome to Acme Corporation</h1>
        <p>Technology solutions for modern businesses</p>
      </section>
    </main>
  </body>
</html>
```

**Response (JSON):** `200 OK`

```json
{
  "success": true,
  "data": {
    "previewHtml": "<!DOCTYPE html>...",
    "previewUrl": "https://cdn.example.com/previews/draft-550e8400.html",
    "generatedAt": "2026-02-04T13:55:25.000Z"
  }
}
```

**Errors:**

- `404 DRAFT_NOT_FOUND`: Draft doesn't exist
- `410 DRAFT_EXPIRED`: Draft TTL expired
- `500 PREVIEW_GENERATION_FAILED`: Template rendering error

---

#### Commit Draft

Migrate draft from temporary to permanent storage after user registration.

**Endpoint:** `POST /api/v1/drafts/:draftId/commit`

**Authentication:** Required - `X-Service-Token` header

**Path Parameters:**

- `draftId` (string, UUID): Draft identifier

**Request Body:**

```json
{
  "userId": "user-123e4567-e89b-12d3-a456-426614174000",
  "metadata": {
    "registrationSource": "google", // Optional: google, email, github
    "registeredAt": "2026-02-04T14:00:00.000Z"
  }
}
```

**Validation:**

- `userId`: Required, valid UUID
- Draft must exist and not be expired
- Service token must be valid

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "siteId": "site-789e4567-e89b-12d3-a456-426614174000",
    "draftId": "draft-550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123e4567-e89b-12d3-a456-426614174000",
    "config": { ... },  // Migrated config with updated asset URLs
    "migratedAt": "2026-02-04T14:00:01.000Z",
    "editUrl": "/sites/site-789e4567/edit"
  }
}
```

**Migration Process:**

1. Validate service token
2. Fetch draft from Redis
3. Create site record in PostgreSQL
4. Copy assets from draft to permanent storage buckets
5. Update asset URLs in config
6. Create ownership record (userId → siteId)
7. Delete draft from Redis
8. Return permanent siteId

**Errors:**

- `401 UNAUTHORIZED`: Missing/invalid service token
- `404 DRAFT_NOT_FOUND`: Draft doesn't exist
- `410 DRAFT_EXPIRED`: Draft TTL expired
- `409 DRAFT_ALREADY_COMMITTED`: Draft already migrated
- `500 MIGRATION_FAILED`: Database or storage error

---

### Assets

#### Upload Logo

Upload a logo image for use in draft configuration.

**Endpoint:** `POST /api/v1/assets/logo`

**Request:** `multipart/form-data`

**Form Fields:**

- `file` (binary, required): Logo file
- `draftId` (string, optional): Associate with draft for tracking

**File Constraints:**

- **Max Size:** 5 MB (configurable)
- **Allowed Types:** `image/png`, `image/jpeg`, `image/svg+xml`
- **Recommended Dimensions:** 256x256 to 1024x1024 pixels

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "assetId": "asset-550e8400-e29b-41d4-a716-446655440000",
    "url": "https://cdn.example.com/draft-assets/550e8400.png",
    "filename": "my-logo.png",
    "mimeType": "image/png",
    "format": "png",
    "dimensions": {
      "width": 512,
      "height": 512
    },
    "sizeBytes": 45678,
    "uploadedAt": "2026-02-04T13:55:25.000Z",
    "expiresAt": "2026-02-05T13:55:25.000Z" // Same TTL as drafts
  }
}
```

**Processing:**

1. Validate file type and size
2. Generate unique assetId
3. Optimize image (resize if too large, compress)
4. Extract dimensions
5. Upload to draft storage bucket
6. Set TTL matching draft expiration
7. Return asset metadata

**Errors:**

- `400 VALIDATION_ERROR`: Missing file
- `413 ASSET_TOO_LARGE`: File exceeds size limit
- `415 UNSUPPORTED_FILE_TYPE`: MIME type not allowed
- `422 INVALID_IMAGE`: Corrupted or invalid image file
- `500 UPLOAD_FAILED`: Storage error

---

### Health

#### Health Check

Service health status for load balancers and monitoring.

**Endpoint:** `GET /health`

**Response:** `200 OK`

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-02-04T13:55:25.000Z",
  "checks": {
    "redis": "connected",
    "database": "connected",
    "storage": "connected"
  }
}
```

**Response (Unhealthy):** `503 Service Unavailable`

```json
{
  "status": "unhealthy",
  "version": "1.0.0",
  "timestamp": "2026-02-04T13:55:25.000Z",
  "checks": {
    "redis": "disconnected",
    "database": "connected",
    "storage": "error: connection timeout"
  }
}
```

---

## Data Schemas

### SiteConfig

Complete site configuration schema (returned in draft responses).

```typescript
{
  configVersion: string;           // "1.0.0"
  brandName: string;
  industry: {
    category: string;
    subcategory: string;
    tags?: string[];
  };
  branding: {
    logo: {
      assetId: string;
      url: string;
      format: "png" | "jpeg" | "svg";
      dimensions: {
        width: number;
        height: number;
      };
    };
    colors: {
      primary: string;             // Hex color
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    typography: {
      headingFont: string;
      bodyFont: string;
    };
  };
  theme: {
    templateId: "default" | "minimal" | "modern";
    style: "light" | "dark" | "auto";
  };
  pages: Array<{
    id: string;
    name: string;
    sections: Array<{
      id: string;
      type: string;              // "hero", "features", "cta", etc.
      order: number;
      content: Record<string, any>;
    }>;
  }>;
  metadata: {
    generatedAt: string;         // ISO 8601
    lastModified: string;
  };
}
```

### Industry Taxonomy

Available categories and subcategories (GET `/api/v1/industries` - future endpoint).

**Sample:**

```json
{
  "Technology": {
    "subcategories": ["SaaS", "E-commerce Platform", "Mobile Apps", "AI/ML"],
    "defaultTags": ["Innovation", "Digital"]
  },
  "E-commerce": {
    "subcategories": ["Fashion", "Electronics", "Food & Beverage", "Handmade"],
    "defaultTags": ["Online Store", "Retail"]
  },
  "Professional Services": {
    "subcategories": ["Consulting", "Legal", "Accounting", "Marketing Agency"],
    "defaultTags": ["B2B", "Services"]
  }
}
```

---

## Error Handling

### Error Codes

| Code                        | HTTP Status | Description                          |
| --------------------------- | ----------- | ------------------------------------ |
| `VALIDATION_ERROR`          | 400         | Request validation failed            |
| `UNAUTHORIZED`              | 401         | Missing or invalid authentication    |
| `FORBIDDEN`                 | 403         | Operation not allowed                |
| `DRAFT_NOT_FOUND`           | 404         | Draft ID doesn't exist               |
| `ASSET_NOT_FOUND`           | 404         | Asset ID doesn't exist               |
| `DRAFT_EXPIRED`             | 410         | Draft TTL has expired                |
| `DRAFT_ALREADY_COMMITTED`   | 409         | Draft already migrated               |
| `ASSET_TOO_LARGE`           | 413         | File exceeds size limit              |
| `UNSUPPORTED_FILE_TYPE`     | 415         | MIME type not allowed                |
| `INVALID_INDUSTRY`          | 422         | Industry not in taxonomy             |
| `INVALID_IMAGE`             | 422         | Image file corrupted                 |
| `PREVIEW_GENERATION_FAILED` | 500         | Template rendering error             |
| `MIGRATION_FAILED`          | 500         | Database/storage error during commit |
| `UPLOAD_FAILED`             | 500         | Storage upload error                 |
| `INTERNAL_ERROR`            | 500         | Unexpected server error              |

### Validation Error Details

For validation errors, the `details` field contains field-specific messages:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "statusCode": 400,
    "details": {
      "brandName": "Brand name must be between 1 and 100 characters",
      "industry.category": "Category must be one of: Technology, E-commerce, ..."
    }
  }
}
```

---

## Rate Limiting

To prevent abuse of anonymous endpoints:

**Limits:**

- **Drafts:** 10 creations per IP per hour
- **Uploads:** 20 files per IP per hour

**Response Headers:**

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1738677325
```

**Error Response:** `429 Too Many Requests`

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 45 minutes.",
    "statusCode": 429,
    "retryAfter": 2700 // seconds
  }
}
```

---

## CORS Configuration

**Development:**

- Allow all origins: `*`

**Production:**

- Whitelist specific origins from `ALLOWED_ORIGINS` env var
- Credentials: `false` (for anonymous access)

**Preflight:**

```http
OPTIONS /api/v1/drafts
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Service-Token
Access-Control-Max-Age: 86400
```

---

## Example Request Flows

### Anonymous User Creates Site

```bash
# 1. Upload logo
curl -X POST http://localhost:3000/api/v1/assets/logo \
  -F "file=@my-logo.png"

# Response: { "data": { "assetId": "asset-123", ... } }

# 2. Create draft with logo
curl -X POST http://localhost:3000/api/v1/drafts \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "My Startup",
    "industry": {
      "category": "Technology",
      "subcategory": "SaaS"
    },
    "logoAssetId": "asset-123"
  }'

# Response: { "data": { "draftId": "draft-456", "previewUrl": "...", ... } }

# 3. View preview
curl http://localhost:3000/api/v1/drafts/draft-456/preview

# Response: HTML preview

# 4. Update configuration
curl -X PATCH http://localhost:3000/api/v1/drafts/draft-456 \
  -H "Content-Type: application/json" \
  -d '{
    "theme": {
      "style": "dark"
    }
  }'

# 5. User registers → Auth service calls commit
curl -X POST http://localhost:3000/api/v1/drafts/draft-456/commit \
  -H "X-Service-Token: secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-789"
  }'

# Response: { "data": { "siteId": "site-101", ... } }
```

---

## Versioning

API version is included in the base path: `/api/v1`

Future versions will use: `/api/v2`, etc.

**Breaking changes** will increment the major version.  
**Non-breaking additions** (new fields, endpoints) will not change version.
