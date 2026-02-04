# Config Generation - Template-Based Algorithm

## Overview

The config generator transforms a `SiteDraft` into a publish-ready `SiteConfig` using a template-based, deterministic algorithm.

## Algorithm Steps

### 0. Inputs

From `SiteDraft`:
- `brandName` (string)
- `industry` (object: `{code, label}`)
- `logo` (object: `{assetId, url}`)
- `generator` metadata
- `draftId`

### 1. Normalize & Validate

**Brand Name:**
```typescript
- Trim whitespace
- Remove control characters (\x00-\x1F, \x7F)
- Normalize multiple spaces to single space
- Enforce length limits (1-100 chars)
```

**Industry Code:**
```typescript
- Validate against known set (tech, finance, etc.)
- Fallback to "other" if unknown
- Auto-generate label if not provided
```

**Logo Reference:**
```typescript
- Validate assetId exists
- Resolve URL from asset storage
- Include in assets array
```

### 2. Select Template

**Template Registry:**
```typescript
industry.code → templateId mapping

Examples:
  "tech" → "it_services" (v1)
  "finance" → "finance_professional" (v1)
  "other" → "default" (v1)
```

**Template Loader:**
```typescript
TemplateLoader.load(templateId) → TemplateDefinition

Contains:
  - defaults.theme (palette, typography, spacing, radius)
  - defaults.seo (title suffix, description template)
  - pages[] (page templates with tokenized sections)
```

### 3. Build BrandProfile Block

**Brand Object:**
```typescript
{
  name: "Кодовая",
  industry: {
    code: "tech",
    label: "Технологии"
  },
  slug: "kodovaya",  // Generated from name
  logo: {
    assetId: "ast_logo_9f2c1a",
    url: "https://cdn.example.com/..."
  }
}
```

**Slug Generation:**
```typescript
"Кодовая Студия" → "kodovaya-studiya"
"Tech Corp!" → "tech-corp"
"Café & Restaurant" → "cafe-restaurant"

Algorithm:
  1. Transliterate Cyrillic to Latin
  2. Remove accents
  3. Replace non-alphanumeric with hyphens
  4. Collapse multiple hyphens
  5. Trim to 50 chars
```

### 4. Generate Theme Defaults

**Template-Driven:**
```typescript
template.defaults.theme provides:

palette: {
  primary: "#025add",
  accent: "#4820a7",
  background: "#ffffff",
  surface: "#f5f7ff",
  text: "#0b1220",
  mutedText: "#5c667a"
}

typography: {
  fontFamily: "Manrope, system-ui, ...",
  scale: "md"  // sm | md | lg
}

radius: "md"  // none | sm | md | lg | full
spacing: "md"  // compact | md | relaxed
```

**No AI yet - fully deterministic:**
- Each template has fixed defaults
- Industry determines template
- Template determines theme

### 5. Generate Pages + Sections

**Token Resolution:**

Template sections contain tokens:
```typescript
props: {
  headline: "{{brandName}} — IT-услуги",
  subheadline: "...",
  logoAssetId: "{{logoAssetId}}"
}
```

Tokens resolved:
```typescript
{{brandName}} → actual brand name
{{industryLabel}} → industry label
{{logoUrl}} → resolved logo URL
{{logoAssetId}} → actual asset ID
{{slug}} → generated slug
```

**Recursive Resolution:**
```typescript
resolveTokens() - for strings
resolveSectionProps() - for nested objects/arrays

Example:
  {
    headline: "Welcome to {{brandName}}",
    items: [
      { title: "{{brandName}} Services" }
    ]
  }
  
  ↓
  
  {
    headline: "Welcome to TechCorp",
    items: [
      { title: "TechCorp Services" }
    ]
  }
```

### 6. Add Publishable Metadata

**Site Metadata:**
```typescript
site: {
  language: "ru-RU",  // From generator.locale
  title: "Кодовая — IT-услуги",
  description: "...",
  routing: {
    basePath: "/",
    trailingSlash: false
  },
  seo: {
    title: "Кодовая — разработка сайтов и IT-решений",
    description: "...",
    ogImageAssetId: "ast_logo_9f2c1a"
  }
}
```

**Assets Array:**
```typescript
assets: [
  {
    assetId: "ast_logo_9f2c1a",
    type: "logo",
    mimeType: "image/svg+xml",
    url: "https://cdn.example.com/...",
    bytes: 1234,
    sha256: "abc123..."
  }
]
```

**Publishing Config:**
```typescript
publishing: {
  target: "static",  // or "dynamic"
  output: {
    format: "html",  // or "react", "vue"
    entryPageId: "home"
  },
  constraints: {
    maxPages: 10,
    maxSectionsPerPage: 30
  }
}
```

**Generator Metadata:**
```typescript
generator: {
  engine: "configurator_site",
  engineVersion: "0.1.0",
  templateId: "it_services",
  templateVersion: 1
}
```

### 7. Output SiteConfig JSON

**Fully Self-Contained:**
```json
{
  "schemaVersion": 1,
  "configVersion": "1.0.0",
  "configId": "cfg_01HTZK8R5G3N9Q7N0B2F1D4A8C",
  "draftId": "drf_01HTZK7Q9P8K5M2V1R6A3C9D2E",
  "generatedAt": "2026-02-04T13:20:00.000Z",
  "generator": {...},
  "brand": {...},
  "site": {...},
  "theme": {...},
  "pages": [...],
  "assets": [...],
  "publishing": {...}
}
```

**Publish-Ready:**
- No draft context needed
- Binary assets referenced via URLs
- Fully declarative
- Version-tracked (schema, config, template)

## Template System

### Template Registry

**Mapping:**
```typescript
class TemplateRegistry {
  static getByIndustry(code: string): TemplateMapping {
    // Returns: { industryCode, templateId, templateVersion }
  }
}
```

### Template Loader

**Loading:**
```typescript
class TemplateLoader {
  static load(templateId: string): TemplateDefinition {
    // Returns complete template definition
  }
}
```

### Template Definition

**Structure:**
```typescript
interface TemplateDefinition {
  templateId: string;
  templateVersion: number;
  name: string;
  description: string;
  defaults: {
    theme: {...},
    seo: {...}
  };
  pages: PageTemplate[];
}
```

### Adding New Templates

**Steps:**
1. Create template definition file
2. Add to TemplateLoader
3. Add mapping to TemplateRegistry

**Example:**
```typescript
// 1. Create file
// src/config_generation/templates/definitions/RestaurantTemplate.ts
export const RestaurantTemplate: TemplateDefinition = {
  templateId: 'restaurant_delicious',
  templateVersion: 1,
  // ... defaults and pages
};

// 2. Add to loader
// src/config_generation/templates/TemplateLoader.ts
const TEMPLATES: Record<string, TemplateDefinition> = {
  'restaurant_delicious': RestaurantTemplate,
  // ...
};

// 3. Add to registry
// src/config_generation/templates/TemplateRegistry.ts
{ industryCode: 'restaurant', templateId: 'restaurant_delicious', templateVersion: 1 }
```

No generator logic changes needed!

## Token System

### Available Tokens

```
{{brandName}}      - Brand name
{{industryLabel}}  - Industry label (localized)
{{logoUrl}}        - Logo URL (or empty)
{{logoAssetId}}    - Logo asset ID (or null)
{{slug}}           - Generated slug
```

### Token Resolution

**String Tokens:**
```typescript
"Welcome to {{brandName}}" → "Welcome to TechCorp"
```

**Object/Array Tokens:**
```typescript
{
  items: [
    { title: "About {{brandName}}" }
  ]
}
↓
{
  items: [
    { title: "About TechCorp" }
  ]
}
```

**Special Handling:**
```typescript
// logoAssetId resolves to actual ID or null
logoAssetId: "{{logoAssetId}}" → logoAssetId: "ast_logo_123" | null
```

## Versioning

### Schema Version

```
schemaVersion: 1
```

Tracks JSON structure format. Increment on breaking changes to SiteConfig shape.

### Config Version

```
configVersion: "1.0.0"
```

Semantic versioning for configuration evolution. Increment on:
- Major: Breaking changes to config semantics
- Minor: New features (backward compatible)
- Patch: Bug fixes

### Template Version

```
templateVersion: 1
```

Per-template versioning. Increment when template changes (new sections, different defaults, etc.).

## Example Output

Complete publish-ready `SiteConfig`:

```json
{
  "schemaVersion": 1,
  "configVersion": "1.0.0",
  "configId": "cfg_01HTZK8R5G3N9Q7N0B2F1D4A8C",
  "draftId": "drf_01HTZK7Q9P8K5M2V1R6A3C9D2E",
  "generatedAt": "2026-02-04T13:20:00.000Z",
  
  "generator": {
    "engine": "configurator_site",
    "engineVersion": "0.1.0",
    "templateId": "it_services",
    "templateVersion": 1
  },
  
  "brand": {
    "name": "Кодовая",
    "industry": {
      "code": "tech",
      "label": "Технологии"
    },
    "slug": "kodovaya",
    "logo": {
      "assetId": "ast_logo_9f2c1a",
      "url": "https://cdn.example.com/assets/ast_logo_9f2c1a.svg"
    }
  },
  
  "site": {
    "language": "ru-RU",
    "title": "Кодовая — IT-услуги",
    "description": "Разработка сайтов и цифровых продуктов для бизнеса.",
    "routing": {
      "basePath": "/",
      "trailingSlash": false
    },
    "seo": {
      "title": "Кодовая — разработка сайтов и IT-решений",
      "description": "Сайты, дизайн, поддержка и разработка под ключ.",
      "ogImageAssetId": "ast_logo_9f2c1a"
    }
  },
  
  "theme": {
    "themeId": "it_services_default",
    "palette": {
      "primary": "#025add",
      "accent": "#4820a7",
      "background": "#ffffff",
      "surface": "#f5f7ff",
      "text": "#0b1220",
      "mutedText": "#5c667a"
    },
    "typography": {
      "fontFamily": "Manrope, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      "scale": "md"
    },
    "radius": "md",
    "spacing": "md"
  },
  
  "pages": [
    {
      "id": "home",
      "path": "/",
      "title": "Главная",
      "sections": [
        {
          "id": "hero_1",
          "type": "hero",
          "props": {
            "headline": "Кодовая — IT-услуги для роста бизнеса",
            "subheadline": "Сайты, дизайн и разработка под ключ. Быстрый старт, понятный процесс.",
            "primaryCta": {
              "text": "Получить консультацию",
              "href": "#contact"
            },
            "secondaryCta": {
              "text": "Посмотреть кейсы",
              "href": "#cases"
            },
            "logoAssetId": "ast_logo_9f2c1a"
          }
        }
      ]
    }
  ],
  
  "assets": [
    {
      "assetId": "ast_logo_9f2c1a",
      "type": "logo",
      "mimeType": "image/svg+xml",
      "url": "https://cdn.example.com/assets/ast_logo_9f2c1a.svg",
      "bytes": 2048,
      "sha256": "abc123..."
    }
  ],
  
  "publishing": {
    "target": "static",
    "output": {
      "format": "html",
      "entryPageId": "home"
    },
    "constraints": {
      "maxPages": 10,
      "maxSectionsPerPage": 30
    }
  }
}
```

## Benefits

✅ **Deterministic** - Same input always produces same output
✅ **Template-Based** - Easy to add new industries
✅ **Publish-Ready** - Self-contained, no draft context needed
✅ **Versioned** - Schema, config, and template versions tracked
✅ **Extensible** - Add templates without changing generator logic
✅ **Testable** - Pure functions, no side effects
✅ **Localized** - Russian content and labels

