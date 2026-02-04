# Preview Rendering - Safe Pipeline

## Overview

The preview rendering system generates safe, sandboxed previews from draft configurations with **zero risk of XSS or arbitrary code execution**.

## Safety Guarantees

✅ **No User-Supplied HTML** - Drafts store only plain text data
✅ **HTML Escaping** - All user inputs are HTML-escaped
✅ **Section Whitelist** - Only predefined section types allowed
✅ **Template Components** - Built-in templates only, no arbitrary HTML
✅ **No Script Tags** - Never generates `<script>` from user input
✅ **ETag Caching** - Efficient caching without exposing internals

## Pipeline Steps

### 1. Load Draft from Redis

```
GET draft:{draft_id}
```

- If missing/expired → `404 DraftNotFound`
- Contains only structured data (brandName, industry, logo reference)

### 2. Refresh TTL (Activity Tracking)

```
EXPIRE draft:{draft_id} <ttlSeconds>
```

Preview requests count as activity - keeps draft alive while user is working.

### 3. Generate SiteConfig (Deterministic)

```typescript
const siteConfig = generator.generate(draft);
```

**Pure Data Transformation:**
- Template selection by industry
- Token replacement (`{{brandName}}` → escaped value)
- Theme defaults from template
- Sections from template (whitelist only)

**No Raw HTML from User:**
- Brand name → escaped text token
- Industry → code + label (predefined)
- Logo → asset reference (URL)

### 4. Render Preview (Safe Templates)

```typescript
const preview = renderer.render(siteConfig, format);
```

**Section Type Whitelist:**
```typescript
const ALLOWED_SECTION_TYPES = [
  'hero',
  'features',
  'about',
  'contact',
  'services',
  'gallery',
  'testimonials',
  'pricing',
  'faq',
  'team',
  'footer',
];
```

**Any unknown section type → skipped**

**HTML Escaping:**
```typescript
escapeHtml(str):
  & → &amp;
  < → &lt;
  > → &gt;
  " → &quot;
  ' → &#039;
```

Applied recursively to all section props.

**Built-in Template Components:**
- Each section type has a predefined HTML template
- Templates use only escaped user inputs
- No `<script>` tags, no event handlers, no `javascript:` URLs

### 5. Generate ETag

```typescript
etag = W/"configId:contentHash"
```

**Stable Cache Identifier:**
- Based on configId + content hash (SHA256)
- Same config → same ETag
- Client can send `If-None-Match` → `304 Not Modified`

## API Endpoints

### Primary Endpoint

```
GET /api/v1/drafts/{draft_id}/preview?type=html|json
```

**Query Parameters:**
- `type`: `html` (default) or `json`

**Response (HTML):**
```json
{
  "draftId": "drf_01...",
  "preview": {
    "type": "html",
    "content": "<!doctype html>...</html>",
    "generatedAt": "2026-02-04T13:40:00.000Z",
    "etag": "W/\"cfg_...:abc123\""
  }
}
```

**Response (JSON):**
```json
{
  "draftId": "drf_01...",
  "preview": {
    "type": "json",
    "model": {
      "theme": {...},
      "pages": [...]
    },
    "generatedAt": "2026-02-04T13:40:00.000Z",
    "etag": "W/\"cfg_...:abc123\""
  }
}
```

### Optional Direct HTML Endpoint

```
GET /p/{draft_id}
```

**Returns:** `text/html` (browser-friendly)

**Still Anonymous:** Bound to draft_id only, no auth.

**Use Case:** Shareable preview links for clients.

## Preview Modes

### Mode 1: On-Demand Generation (MVP)

**Flow:**
```
Request → Load Draft → Generate Config → Render Preview → Response
```

**Advantages:**
- Simple implementation
- No cache invalidation needed
- Always up-to-date

**Performance:**
- Add ETag caching
- Client sends `If-None-Match`
- Server returns `304` if unchanged

**Recommended for MVP**

### Mode 2: Cached Preview (Optional)

**Flow:**
```
Update Draft → Regenerate Preview → Store in Redis
Request → Serve Cached Preview
```

**Storage:**
```
preview:{draft_id} → HTML or JSON (same TTL as draft)
```

**Refresh:**
```
EXPIRE preview:{draft_id} <ttlSeconds>
```

**Advantages:**
- Faster response time
- Less CPU usage

**Disadvantages:**
- More complex
- Cache invalidation on update
- More Redis memory

**Recommendation:** Start with Mode 1, add Mode 2 if needed.

## Security Enforcement

### 1. Input Validation

**Draft Fields:**
```typescript
{
  brandName: string (1-100 chars, validated)
  industry: { code: enum, label: string }
  logo: { assetId: UUID, url: string }
}
```

No HTML, no scripts, only structured data.

### 2. HTML Escaping

**All User Inputs:**
```typescript
headline: "Tech & Co <script>alert('xss')</script>"
↓ (escaped)
headline: "Tech &amp; Co &lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"
```

**Rendered as plain text, never executed.**

### 3. Section Type Whitelist

```typescript
if (!ALLOWED_SECTION_TYPES.has(section.type)) {
  // Skip unknown section
  return '';
}
```

**Only predefined templates can render.**

### 4. Content Scanning

```typescript
if (containsUnsafeContent(props)) {
  throw new Error('Unsafe content detected');
}
```

**Patterns blocked:**
- `<script`
- `<iframe`
- `<object`
- `javascript:`
- `on*=` (event handlers)

### 5. No Arbitrary HTML

Templates use:
```html
<!-- Safe: escaped variable -->
<h1>${escapeHtml(headline)}</h1>

<!-- NOT allowed: raw HTML -->
<div>{{{rawHtml}}}</div>  ❌
```

## ETag Caching

### ETag Generation

```typescript
configId = "cfg_01HTZK8R..."
contentHash = sha256(JSON.stringify(config)).substring(0, 16)
etag = W/"cfg_01HTZK8R...:abc123def456"
```

**Weak ETag (`W/`):** Content semantically equivalent, not byte-identical.

### Client Caching

**Request with ETag:**
```http
GET /api/v1/drafts/drf_01.../preview
If-None-Match: W/"cfg_...:abc123"
```

**Response if unchanged:**
```http
HTTP/1.1 304 Not Modified
ETag: W/"cfg_...:abc123"
```

**Response if changed:**
```http
HTTP/1.1 200 OK
ETag: W/"cfg_...:def456"
{
  "preview": {...}
}
```

### Cache Invalidation

**When draft updates:**
1. Draft data changes
2. Config regeneration produces new configId
3. New ETag generated
4. Client's cached version invalidated

**Automatic and safe.**

## TTL Behavior

### Preview Request = Activity

```typescript
// Load draft with TTL refresh
const draft = await repository.findById(draftId, refreshTtl: true);

// Internally:
GET draft:{id}
EXPIRE draft:{id} <ttlSeconds>
```

**Effect:** Draft stays alive while user is actively previewing.

### Cached Preview TTL

If using Mode 2 (cached preview):
```typescript
// On preview request
EXPIRE preview:{id} <ttlSeconds>
```

**Keep draft and preview TTLs synchronized.**

## Example Flow

### Complete Preview Generation

```bash
# 1. Client requests preview
GET /api/v1/drafts/drf_abc/preview?type=html

# 2. Server loads draft
GET draft:drf_abc  # → {brandName: "TechCorp", industry: {code: "tech"}, ...}

# 3. Server refreshes TTL (activity)
EXPIRE draft:drf_abc 86400

# 4. Server generates config (deterministic)
siteConfig = {
  brand: {name: "TechCorp", ...},
  theme: {palette: {...}, ...},
  pages: [{sections: [...]}]
}

# 5. Server renders preview (safe templates)
html = renderSections(sections, theme)
  - escapeHtml("TechCorp") in all templates
  - only allowed section types
  - no user HTML/JS

# 6. Server generates ETag
etag = W/"cfg_xyz:abc123"

# 7. Server responds
{
  "preview": {
    "type": "html",
    "content": "<!doctype html>...",
    "etag": "W/\"cfg_xyz:abc123\""
  }
}
```

### With ETag Caching

```bash
# 1. Client requests with cached ETag
GET /api/v1/drafts/drf_abc/preview
If-None-Match: W/"cfg_xyz:abc123"

# 2. Server loads draft & generates config
draft → config (cfg_xyz)

# 3. Server generates ETag
currentETag = W/"cfg_xyz:abc123"

# 4. Server compares ETags
if (currentETag === requestETag):
  return 304 Not Modified
  
# 5. Client uses cached preview ✅
```

## Testing

### Security Tests

```typescript
it('escapes HTML in brand name', async () => {
  draft.brandName = 'Tech<script>alert("xss")</script>Corp';
  const preview = await renderer.render(config, 'html');
  expect(preview.content).not.toContain('<script>');
  expect(preview.content).toContain('&lt;script&gt;');
});

it('blocks unknown section types', async () => {
  config.pages[0].sections.push({
    id: 'evil',
    type: 'evil_section',  // Not in whitelist
    props: {malicious: 'content'}
  });
  const preview = await renderer.render(config, 'html');
  expect(preview.content).not.toContain('evil_section');
  expect(preview.content).not.toContain('malicious');
});

it('detects unsafe content', async () => {
  section.props.text = '<iframe src="evil.com">';
  await expect(renderer.sanitizeSection(section))
    .rejects.toThrow('Unsafe content detected');
});
```

### Performance Tests

```typescript
it('generates stable ETags', async () => {
  const preview1 = await renderer.render(config, 'html');
  const preview2 = await renderer.render(config, 'html');
  expect(preview1.etag).toBe(preview2.etag);
});

it('refreshes TTL on preview', async () => {
  await getPreviewUseCase.execute({draftId, type: 'html'});
  const ttl = await repository.getTTL(draftId);
  expect(ttl).toBeCloseTo(86400, -2);
});
```

## Best Practices

✅ **DO:**
- Escape all user inputs
- Use section type whitelist
- Generate ETags for caching
- Refresh TTL on preview
- Validate content for unsafe patterns

❌ **DON'T:**
- Accept arbitrary HTML from users
- Render unknown section types
- Include `<script>` tags from user data
- Trust user input without escaping
- Skip security validation

The preview system is safe by design!

