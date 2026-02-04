# Schema Migration - Updated Data Models

## Overview

The service has been refactored to support more detailed and structured schemas for `BrandProfile`, `SiteDraft`, and `SiteConfig`.

## Schema Changes

### 1. BrandProfile (New)

**Schema Version:** 1

```typescript
{
  schemaVersion: 1,
  brandName: string,
  industry: {
    code: string,      // e.g., "tech", "finance"
    label: string      // e.g., "Технологии", "Финансы"
  },
  logo?: {
    assetId: string,
    url: string,
    mimeType: string,
    width?: number,
    height?: number,
    bytes: number,
    sha256: string,
    uploadedAt: Date
  }
}
```

**Key Changes:**
- Industry now has both `code` and `label`
- Logo includes comprehensive metadata (dimensions, hash, size)
- Separate entity for brand information

### 2. SiteDraft (Replaces Draft)

**Schema Version:** 1

```typescript
{
  schemaVersion: 1,
  draftId: string (UUID),
  status: "DRAFT",
  createdAt: Date,
  updatedAt: Date,
  expiresAt: Date,
  ttlSeconds: number,
  
  brandProfile: BrandProfile,  // Nested brand information
  
  generator: {
    engine: "configurator_site",
    engineVersion: "0.1.0",
    templateId: string,
    locale: "ru-RU"
  },
  
  preview: {
    mode: "html" | "json",
    url?: string,
    lastGeneratedAt?: Date,
    etag?: string
  },
  
  meta: {
    ipHash?: string,
    userAgentHash?: string,
    source: string,       // "web", "api", etc.
    notes?: string
  }
}
```

**Key Changes:**
- Nested `brandProfile` instead of flat brand fields
- Added `generator` metadata for tracking engine and template
- Added `preview` metadata for caching
- Added `meta` for tracking and analytics
- `status` field (currently only "DRAFT")

### 3. SiteConfig (Enhanced)

**Schema Version:** 1

```typescript
{
  schemaVersion: 1,
  configId: string (UUID),
  draftId: string (UUID),
  generatedAt: Date,
  
  generator: {
    engine: "configurator_site",
    engineVersion: "0.1.0",
    templateId: string
  },
  
  brand: {
    brandName: string,
    industry: { code: string, label: string },
    logo?: { assetId: string, url: string }
  },
  
  theme: {
    themeId: string,
    palette: {
      primary: "#025add",
      accent: "#4820a7",
      background: "#ffffff",
      text: "#111111"
    },
    typography: {
      fontFamily: string,
      scale: "sm" | "md" | "lg"
    },
    radius: "none" | "sm" | "md" | "lg" | "full",
    spacing: "compact" | "md" | "relaxed"
  },
  
  site: {
    title: string,
    description: string,
    language: "ru-RU",
    seo: {
      title: string,
      description: string,
      ogImageAssetId?: string
    }
  },
  
  pages: [
    {
      id: "home",
      path: "/",
      title: string,
      sections: [
        {
          id: "hero-1",
          type: "hero",
          props: {
            headline: string,
            subheadline: string,
            ctaText: string,
            ...
          }
        }
      ]
    }
  ],
  
  assets: [
    {
      assetId: string,
      type: "logo" | "image" | ...,
      url: string,
      mimeType: string,
      bytes: number,
      sha256: string
    }
  ]
}
```

**Key Changes:**
- Separate `configId` from `draftId`
- Generator metadata included
- Enhanced theme with palette, typography, radius, spacing
- SEO metadata
- Pages as array (multi-page support)
- Assets array with full metadata
- Sections use generic `props` object

## Domain Layer Updates

### New Value Objects

1. **AssetInfo** - Comprehensive asset metadata
   - Dimensions (width, height)
   - Size (bytes)
   - Hash (sha256)
   - Upload timestamp

2. **IndustryInfo** - Industry with code and label
   - Code: machine-readable (e.g., "tech")
   - Label: human-readable (e.g., "Технологии")

3. **GeneratorInfo** - Generator metadata
   - Engine name and version
   - Template ID
   - Locale

4. **PreviewInfo** - Preview caching metadata
   - Mode (html/json)
   - URL
   - Last generated timestamp
   - ETag for cache validation

5. **DraftMeta** - Tracking metadata
   - IP hash (privacy-preserving)
   - User agent hash
   - Source (web, api, etc.)
   - Notes

### Updated Entities

1. **BrandProfile** (New)
   - Extracted brand information
   - Schema versioning
   - Immutable updates

2. **SiteDraft** (Replaces Draft)
   - Composition with BrandProfile
   - Generator and preview info
   - Metadata tracking
   - Status field for future workflows

3. **SiteConfig** (Enhanced)
   - Structured theme configuration
   - Multi-page support
   - Asset management
   - SEO metadata

## API Changes

### Request DTOs

#### Create Draft

**Before:**
```json
{
  "brandName": "string",
  "industry": "tech",
  "description": "string",
  "primaryColor": "#0066FF",
  ...
}
```

**After:**
```json
{
  "brandName": "string",
  "industryCode": "tech",
  "industryLabel": "Технологии",
  "generator": {
    "templateId": "default",
    "locale": "ru-RU"
  },
  "meta": {
    "source": "web",
    "notes": "string"
  }
}
```

### Response DTOs

Responses now include full nested structures matching the schemas.

## Storage Layer Updates

### Redis Storage Format

```json
{
  // SiteDraft JSON representation
  "schemaVersion": 1,
  "draftId": "uuid",
  "status": "DRAFT",
  "brandProfile": { ... },
  "generator": { ... },
  "preview": { ... },
  "meta": { ... },
  ...
}
```

**Key Changes:**
- Nested JSON structure
- Schema version for migration support
- Additional metadata fields

## Config Generation Updates

### Template Provider

Templates now return structured theme configurations:

```typescript
{
  themeId: "tech-modern",
  palette: {
    primary: "#0066FF",
    accent: "#00D4FF",
    background: "#ffffff",
    text: "#111111"
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    scale: "md"
  },
  radius: "md",
  spacing: "md"
}
```

### Section Generation

Sections now use generic `props` structure:

```typescript
{
  id: "hero-1",
  type: "hero",
  props: {
    headline: "...",
    subheadline: "...",
    ctaText: "...",
    backgroundImage: "..."
  }
}
```

## Migration Strategy

### For Existing Data

1. **Schema Version Field**: All entities have `schemaVersion: 1`
2. **Backward Compatibility**: Old drafts (if any) need migration
3. **Fallback Values**: Missing fields filled with defaults

### Migration Script

```typescript
// Pseudo-code for migrating old Draft to new SiteDraft
function migrateDraftToSiteDraft(oldDraft) {
  return {
    schemaVersion: 1,
    draftId: oldDraft.id,
    status: "DRAFT",
    createdAt: oldDraft.createdAt,
    updatedAt: oldDraft.updatedAt || oldDraft.createdAt,
    expiresAt: oldDraft.expiresAt,
    ttlSeconds: oldDraft.ttlSeconds,
    brandProfile: {
      schemaVersion: 1,
      brandName: oldDraft.brandName,
      industry: {
        code: oldDraft.industry,
        label: getIndustryLabel(oldDraft.industry)
      },
      logo: oldDraft.logoRef ? mapLogo(oldDraft.logoRef) : undefined
    },
    generator: {
      engine: "configurator_site",
      engineVersion: "0.1.0",
      templateId: "default",
      locale: "ru-RU"
    },
    preview: {
      mode: "html"
    },
    meta: {
      source: "web"
    }
  };
}
```

## Benefits

### 1. Schema Versioning
- Future schema changes can be migrated
- `schemaVersion` field tracks format

### 2. Structured Data
- Clear separation of concerns
- Easier validation and type safety

### 3. Extensibility
- `props` object allows arbitrary section data
- `meta` field for tracking
- `generator` metadata for multi-engine support

### 4. Better Caching
- Preview etags for cache validation
- Asset metadata for CDN integration

### 5. Multi-language Support
- Industry labels in locale language
- `locale` field in generator
- `language` field in site config

## Localization

Default locale: `ru-RU`

Industry labels in Russian:
- `tech` → "Технологии"
- `finance` → "Финансы"
- `healthcare` → "Здравоохранение"
- `retail` → "Розничная торговля"
- `education` → "Образование"
- `real-estate` → "Недвижимость"
- `consulting` → "Консалтинг"
- `restaurant` → "Ресторан"
- `other` → "Другое"

## API Endpoint Examples

### Create Draft

```bash
POST /api/v1/drafts
{
  "brandName": "ТехКорп",
  "industryCode": "tech",
  "meta": {
    "source": "web"
  }
}
```

### Response

```json
{
  "success": true,
  "data": {
    "schemaVersion": 1,
    "draftId": "uuid",
    "status": "DRAFT",
    "brandProfile": {
      "schemaVersion": 1,
      "brandName": "ТехКорп",
      "industry": {
        "code": "tech",
        "label": "Технологии"
      }
    },
    "generator": {
      "engine": "configurator_site",
      "engineVersion": "0.1.0",
      "templateId": "default",
      "locale": "ru-RU"
    },
    ...
  }
}
```

## Implementation Status

✅ **Completed:**
- Domain entities (BrandProfile, SiteDraft, SiteConfig)
- Value objects (AssetInfo, IndustryInfo, GeneratorInfo, PreviewInfo, DraftMeta)
- Schema definitions

🔄 **In Progress:**
- DTOs and validation schemas
- Config generation update
- Storage layer update
- API controllers update

⏳ **Pending:**
- Migration scripts for existing data
- Preview caching implementation
- Asset hash calculation on upload
- Multi-page generation logic

