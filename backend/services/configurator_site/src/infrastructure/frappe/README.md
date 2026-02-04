# Frappe Integration

## Overview

This directory contains the Frappe adapter implementation that integrates Frappe Builder as the rendering engine for the configurator service.

## Directory Structure

```
infrastructure/frappe/
├── FrappeRendererAdapter.ts  # Main adapter implementation
├── FrappeConfig.ts            # Frappe configuration types
├── FrappeMapper.ts            # Domain model to Frappe format mapping
├── FrappeTypes.ts             # TypeScript types for Frappe
├── lib/                       # Frappe library (builder-develop.zip extracted)
│   └── ...                    # Frappe source code
└── README.md                  # This file
```

## Setup Instructions

### 1. Extract Frappe Library

Extract the contents of `builder-develop.zip` into the `lib/` directory:

```bash
cd backend/services/configurator_site/src/infrastructure/frappe
unzip /path/to/builder-develop.zip -d lib/
```

After extraction, the structure should look like:

```
lib/
├── package.json
├── src/
├── components/
└── ...
```

### 2. Install Frappe Dependencies

```bash
cd lib/
npm install
```

### 3. Configure Environment

Add to `.env`:

```bash
# Frappe Configuration
ENABLE_FRAPPE=true
FRAPPE_LIBRARY_PATH=./src/infrastructure/frappe/lib
FRAPPE_SSR_ENABLED=true
FRAPPE_MINIFY_HTML=false
```

## Usage

The Frappe adapter is automatically injected into the preview renderer when enabled:

```typescript
// In DIContainer
const frappeAdapter = this.createFrappeAdapter();
const previewRenderer = new SafePreviewRenderer(frappeAdapter);
```

## Fallback Behavior

If Frappe is disabled or unavailable, the system falls back to the built-in preview renderer:

```typescript
if (!frappeAdapter || !frappeAdapter.isAvailable()) {
  // Use fallback renderer
}
```

## Security

All output from Frappe passes through security validation:
- HTML sanitization
- XSS protection
- Section type whitelist validation

## Testing

Run Frappe integration tests:

```bash
npm test -- --grep "Frappe"
```

## Replacing Frappe

To replace Frappe with an alternative renderer:

1. Create new adapter implementing `FrappeAdapter` interface
2. Update `DIContainer.createFrappeAdapter()` to return new adapter
3. No changes needed in API, domain, or application layers

