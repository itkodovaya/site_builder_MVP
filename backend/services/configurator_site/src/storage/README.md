# Storage Layer - Redis Implementation

## Overview

TTL-based draft storage using Redis with automatic expiration.

## Key Structure

```
draft:{draftId} → JSON (SiteDraft)
```

Example:
```
draft:550e8400-e29b-41d4-a716-446655440000 → {"schemaVersion":1,"draftId":"550e8400...","status":"DRAFT",...}
```

## TTL Behavior

**Sliding TTL**: Refreshed on every update (and optionally on reads)

- **Create**: Set initial TTL
- **Update**: Refresh TTL (sliding window)
- **Read**: Optionally refresh TTL (for "activity" tracking)
- **Expire**: Redis auto-deletes after TTL

## Operations

### 1. Create Draft

```redis
SET draft:{draftId} <json> EX <ttlSeconds> NX
```

- `NX`: Only set if key doesn't exist (create new)
- `EX`: Set expiration in seconds
- Returns `OK` on success

**Implementation:**
```typescript
await repository.save(newDraft);
```

### 2. Update Draft

```redis
GET draft:{draftId}
SET draft:{draftId} <json> EX <ttlSeconds> XX
```

- `GET`: Fetch existing draft
- `XX`: Only set if key exists (update existing)
- `EX`: Refresh TTL (sliding window)

**Implementation:**
```typescript
const draft = await repository.findById(draftId);
const updated = draft.update({...});
await repository.save(updated); // Refreshes TTL
```

### 3. Read Draft

**Option A: Read without TTL refresh (default)**
```redis
GET draft:{draftId}
```

**Option B: Read with TTL refresh (activity tracking)**
```redis
GET draft:{draftId}
EXPIRE draft:{draftId} <ttlSeconds>
```

**Implementation:**
```typescript
// No refresh (default)
const draft = await repository.findById(draftId);

// With refresh (for preview/activity)
const draft = await repository.findById(draftId, refreshTtl: true);
```

### 4. Delete Draft

**Automatic (primary):**
```
Redis auto-deletes when TTL expires
```

**Manual (optional):**
```redis
DEL draft:{draftId}
```

**Implementation:**
```typescript
await repository.delete(draftId);
```

## Concurrency Control

### Option A: Optimistic Locking with WATCH

For safe concurrent updates:

```redis
WATCH draft:{draftId}
GET draft:{draftId}
MULTI
  SET draft:{draftId} <json> EX <ttlSeconds>
EXEC
```

**Implementation:**
```typescript
await repository.updateWithLock(draftId, (draft) => {
  return draft.update({...});
});
```

### Option B: Version/ETag in Draft

Store version in draft JSON:
```json
{
  "schemaVersion": 1,
  "draftId": "...",
  "version": 1,  // Increment on each update
  ...
}
```

Client sends `If-Match: version` header, server validates.

## Configuration

### Constructor Options

```typescript
new SiteDraftRepositoryRedis(
  redisClient,
  refreshTtlOnRead: boolean = false  // Enable sliding TTL on reads
)
```

**Recommendations:**
- `refreshTtlOnRead: false` - For "get draft" endpoint (read-only)
- `refreshTtlOnRead: true` - For "preview" endpoint (activity tracking)

Or pass `refreshTtl` parameter explicitly per call:
```typescript
repository.findById(id, refreshTtl: true);
```

## TTL Strategy

### Sliding TTL (Recommended)

TTL refreshes on activity (updates, previews):

```
Create: t=0, TTL=24h  → expires t=24h
Update: t=12h, TTL=24h → expires t=36h
Preview: t=20h, TTL=24h → expires t=44h
```

Draft stays alive as long as user is active.

### Fixed TTL (Alternative)

TTL never refreshes - draft expires exactly X hours after creation:

```
Create: t=0, TTL=24h → expires t=24h
Update: t=12h → still expires t=24h (no refresh)
```

Less flexible but more predictable.

**Implementation**: Don't refresh TTL on updates, only compute from `createdAt`.

## Error Handling

### Draft Not Found

```typescript
const draft = await repository.findById(id);
if (!draft) {
  throw new DraftNotFoundError(id);
}
```

Could be:
- Draft never existed
- Draft expired (TTL hit zero)
- Draft was manually deleted

### Draft Expired

Check expiration before operations:

```typescript
const draft = await repository.findById(id);
if (draft && draft.isExpired()) {
  throw new DraftExpiredError(id);
}
```

Although Redis should auto-delete, there might be clock skew.

### Concurrent Modification

With optimistic locking:

```typescript
try {
  await repository.updateWithLock(id, updateFn);
} catch (error) {
  // Return 409 Conflict
  throw new ConcurrentModificationError();
}
```

## Storage Format Example

### JSON Structure in Redis

```json
{
  "schemaVersion": 1,
  "draftId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "DRAFT",
  "createdAt": "2026-02-04T12:00:00.000Z",
  "updatedAt": "2026-02-04T13:30:00.000Z",
  "expiresAt": "2026-02-05T13:30:00.000Z",
  "ttlSeconds": 86400,
  "brandProfile": {
    "schemaVersion": 1,
    "brandName": "ТехКорп",
    "industry": {
      "code": "tech",
      "label": "Технологии"
    },
    "logo": {
      "assetId": "logo-uuid",
      "url": "https://s3.../logos/logo-uuid.png",
      "mimeType": "image/png",
      "width": 1200,
      "height": 600,
      "bytes": 150000,
      "sha256": "abc123...",
      "uploadedAt": "2026-02-04T12:15:00.000Z"
    }
  },
  "generator": {
    "engine": "configurator_site",
    "engineVersion": "0.1.0",
    "templateId": "default",
    "locale": "ru-RU"
  },
  "preview": {
    "mode": "html",
    "url": "https://preview.../550e8400...",
    "lastGeneratedAt": "2026-02-04T13:25:00.000Z",
    "etag": "W/\"abc123\""
  },
  "meta": {
    "ipHash": "sha256:aabbcc...",
    "userAgentHash": "sha256:ddeeff...",
    "source": "web",
    "notes": ""
  }
}
```

## Monitoring

### Key Metrics

```redis
# Total drafts
DBSIZE

# Draft TTL distribution
TTL draft:{id1}
TTL draft:{id2}
...

# Memory usage
MEMORY USAGE draft:{id}

# Keys expiring soon
SCAN 0 MATCH draft:* COUNT 100
```

### Redis Commands for Debugging

```bash
# List all drafts
redis-cli --scan --pattern "draft:*"

# Inspect draft
redis-cli GET "draft:550e8400-e29b-41d4-a716-446655440000"

# Check TTL
redis-cli TTL "draft:550e8400-e29b-41d4-a716-446655440000"

# Manual cleanup
redis-cli DEL "draft:550e8400-e29b-41d4-a716-446655440000"
```

## Performance Considerations

### Memory Usage

Each draft: ~2-5 KB (depending on logo metadata)

```
10,000 drafts ≈ 20-50 MB
100,000 drafts ≈ 200-500 MB
```

Redis handles this easily.

### TTL Precision

Redis expires keys in background:
- Not precisely at expiration time
- May take a few seconds after TTL=0
- Don't rely on exact expiration timing

### Cleanup

No manual cleanup needed:
- Redis automatically deletes expired keys
- No cron jobs required
- Memory freed automatically

## Migration

### From Old Format

If migrating from old `Draft` format:

```typescript
// Old format
draft:abc123 → {"id":"abc123","brandName":"...","industry":"tech"}

// New format  
draft:abc123 → {"schemaVersion":1,"draftId":"abc123","brandProfile":{...}}
```

Migration script:
1. Read old format
2. Transform to new structure
3. Write with schema version
4. Set TTL

## Best Practices

✅ **DO:**
- Use sliding TTL on updates
- Optionally refresh on preview (activity)
- Let Redis handle expiration
- Use optimistic locking for concurrent updates

❌ **DON'T:**
- Don't run cleanup cron jobs (Redis does it)
- Don't update `expiresAt` on read (just refresh Redis TTL)
- Don't store large binary data in draft (use asset storage)
- Don't rely on exact expiration timing

## Testing

### Unit Tests

```typescript
describe('SiteDraftRepositoryRedis', () => {
  it('creates draft with TTL', async () => {
    await repository.save(draft);
    const ttl = await repository.getTTL(draft.getDraftId());
    expect(ttl).toBeCloseTo(86400, -2);
  });

  it('refreshes TTL on update', async () => {
    await repository.save(draft);
    await sleep(1000);
    const updated = draft.update({...});
    await repository.save(updated);
    const ttl = await repository.getTTL(draft.getDraftId());
    expect(ttl).toBeCloseTo(86400, -2);
  });

  it('optionally refreshes TTL on read', async () => {
    await repository.save(draft);
    await sleep(1000);
    await repository.findById(draft.getDraftId(), true);
    const ttl = await repository.getTTL(draft.getDraftId());
    expect(ttl).toBeCloseTo(86400, -2);
  });
});
```

### Integration Tests

```typescript
it('draft expires after TTL', async () => {
  const draft = SiteDraft.create({
    brandProfile,
    ttlSeconds: 2  // 2 seconds for test
  });
  
  await repository.save(draft);
  expect(await repository.exists(draft.getDraftId())).toBe(true);
  
  await sleep(3000);
  expect(await repository.exists(draft.getDraftId())).toBe(false);
});
```

