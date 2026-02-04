/**
 * Redis-based SiteDraft Repository
 * Implements TTL-based draft storage with sliding TTL on updates
 * 
 * Key structure: draft:{draftId} → JSON (SiteDraft)
 * TTL: Sliding - refreshed on updates and optionally on reads
 */

import { Redis } from 'ioredis';
import { DraftRepository } from '../domain/ports/DraftRepository';
import { SiteDraft } from '../domain/entities/SiteDraft';
import { BrandProfile } from '../domain/entities/BrandProfile';
import { DraftId } from '../domain/value-objects/DraftId';
import { IndustryInfo } from '../domain/value-objects/IndustryInfo';
import { AssetInfo } from '../domain/value-objects/AssetInfo';
import { GeneratorInfo } from '../domain/value-objects/GeneratorInfo';
import { PreviewInfo } from '../domain/value-objects/PreviewInfo';
import { DraftMeta } from '../domain/value-objects/DraftMeta';

export class SiteDraftRepositoryRedis implements DraftRepository {
  private readonly keyPrefix = 'draft:';

  constructor(
    private readonly redis: Redis,
    private readonly refreshTtlOnRead: boolean = false
  ) {}

  /**
   * Create new draft
   * Uses SET with NX (only if key doesn't exist) and EX (expiration)
   */
  async save(draft: SiteDraft): Promise<void> {
    const key = this.buildKey(draft.draftId);
    const json = JSON.stringify(draft.toJSON());
    const ttl = Math.max(1, Math.floor((draft.expiresAt.getTime() - Date.now()) / 1000));
    
    // SET draft:{id} <json> EX <ttlSeconds> NX
    const result = await this.redis.set(key, json, 'EX', ttl, 'NX');
    if (result !== 'OK') {
      throw new Error('Failed to create draft: key already exists');
    }
  }

  /**
   * Update existing draft with TTL refresh (sliding TTL)
   * Uses SET with XX (only if key exists) and EX (expiration)
   */
  async update(draft: SiteDraft): Promise<void> {
    const key = this.buildKey(draft.draftId);
    const json = JSON.stringify(draft.toJSON());
    const ttl = Math.max(1, Math.floor((draft.expiresAt.getTime() - Date.now()) / 1000));
    
    // SET draft:{id} <json> EX <ttlSeconds> XX
    const result = await this.redis.set(key, json, 'EX', ttl, 'XX');
    if (result !== 'OK') {
      throw new Error('Failed to update draft: key does not exist');
    }
  }

  /**
   * Find draft by ID
   * Optionally refreshes TTL on read (sliding TTL for "activity")
   */
  async findById(id: DraftId, refreshTtl: boolean = this.refreshTtlOnRead): Promise<SiteDraft | null> {
    const key = this.buildKey(id);
    
    // GET draft:{id}
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    // Optionally refresh TTL on read (for "activity" tracking)
    if (refreshTtl) {
      try {
        const json = JSON.parse(data);
        const draft = SiteDraft.fromJSON(json);
        const ttl = draft.ttlSeconds;
        
        // EXPIRE draft:{id} <ttlSeconds>
        await this.redis.expire(key, ttl);
      } catch (error) {
        // If parsing fails, skip TTL refresh
        console.error('Failed to parse draft for TTL refresh:', error);
      }
    }

    try {
      const json = JSON.parse(data);
      return SiteDraft.fromJSON(json);
    } catch (error) {
      console.error('Failed to deserialize draft:', error);
      // Invalid data format - delete the key
      await this.redis.del(key);
      return null;
    }
  }

  /**
   * Check if draft exists
   */
  async exists(id: DraftId): Promise<boolean> {
    const key = this.buildKey(id);
    const result = await this.redis.exists(key);
    return result === 1;
  }

  /**
   * Delete draft manually
   * DEL draft:{id}
   * 
   * Note: Most deletions happen automatically via TTL expiration
   */
  async delete(id: DraftId): Promise<void> {
    const key = this.buildKey(id);
    await this.redis.del(key);
  }

  /**
   * Get remaining TTL in seconds
   * Returns null if draft doesn't exist
   */
  async getTTL(id: DraftId): Promise<number | null> {
    const key = this.buildKey(id);
    const ttl = await this.redis.ttl(key);
    
    // -2 means key doesn't exist, -1 means no expiration
    if (ttl < 0) {
      return null;
    }
    
    return ttl;
  }

  /**
   * Update draft with optimistic locking (optional)
   * Uses WATCH + MULTI/EXEC for atomic read-modify-write
   */
  async updateWithLock(
    id: DraftId,
    updateFn: (draft: SiteDraft) => SiteDraft
  ): Promise<SiteDraft> {
    const key = this.buildKey(id);
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;

      // Watch the key for changes
      await this.redis.watch(key);

      // Get current draft
      const data = await this.redis.get(key);
      if (!data) {
        await this.redis.unwatch();
        throw new Error('Draft not found');
      }

      const json = JSON.parse(data);
      const currentDraft = SiteDraft.fromJSON(json);

      // Apply update
      const updatedDraft = updateFn(currentDraft);
      const updatedJson = JSON.stringify(updatedDraft.toJSON());
      const ttl = Math.max(1, Math.floor((updatedDraft.expiresAt.getTime() - Date.now()) / 1000));

      // Atomic update using transaction
      const result = await this.redis
        .multi()
        .set(key, updatedJson, 'EX', ttl)
        .exec();

      if (result !== null) {
        // Success - transaction executed
        return updatedDraft;
      }

      // Transaction failed (key was modified), retry
      if (attempt >= maxRetries) {
        throw new Error('Failed to update draft: too many concurrent modifications');
      }
    }

    throw new Error('Failed to update draft');
  }

  private buildKey(id: DraftId): string {
    return `${this.keyPrefix}${id.toString()}`;
  }
}
