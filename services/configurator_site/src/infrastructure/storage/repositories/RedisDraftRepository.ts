/**
 * Redis implementation of draft repository
 * Uses Redis native TTL for automatic expiration
 */

import Redis from 'ioredis';
import { DraftSite } from '../../../domain/entities/DraftSite.js';
import { IDraftRepository } from '../interfaces/IDraftRepository.js';
import { NotFoundError } from '../../../shared/errors/NotFoundError.js';
import { logger } from '../../../shared/utils/logger.js';

export class RedisDraftRepository implements IDraftRepository {
  private readonly keyPrefix = 'draft:';

  constructor(private readonly redis: Redis) {}

  async create(draft: DraftSite): Promise<string> {
    const key = this.getKey(draft.draftId);
    const value = JSON.stringify(this.serialize(draft));
    const ttlSeconds = Math.floor(
      (draft.ttl.expiresAt.getTime() - Date.now()) / 1000
    );

    await this.redis.setex(key, ttlSeconds, value);

    logger.info({ draftId: draft.draftId, ttl: ttlSeconds }, 'Draft created in Redis');

    return draft.draftId;
  }

  async get(draftId: string): Promise<DraftSite | null> {
    const key = this.getKey(draftId);
    const value = await this.redis.get(key);

    if (!value) {
      return null;
    }

    return this.deserialize(JSON.parse(value));
  }

  async update(draftId: string, draft: DraftSite): Promise<void> {
    const key = this.getKey(draftId);
    const exists = await this.redis.exists(key);

    if (!exists) {
      throw new NotFoundError(`Draft ${draftId} not found`);
    }

    const value = JSON.stringify(this.serialize(draft));
    const ttlSeconds = Math.floor(
      (draft.ttl.expiresAt.getTime() - Date.now()) / 1000
    );

    // Use SETEX to update value and reset TTL atomically
    await this.redis.setex(key, ttlSeconds, value);

    logger.info({ draftId, newTtl: ttlSeconds }, 'Draft updated in Redis');
  }

  async delete(draftId: string): Promise<void> {
    const key = this.getKey(draftId);
    await this.redis.del(key);

    logger.info({ draftId }, 'Draft deleted from Redis');
  }

  async exists(draftId: string): Promise<boolean> {
    const key = this.getKey(draftId);
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async refreshTTL(draftId: string, ttlSeconds: number): Promise<void> {
    const key = this.getKey(draftId);
    const result = await this.redis.expire(key, ttlSeconds);

    if (result === 0) {
      throw new NotFoundError(`Draft ${draftId} not found`);
    }

    logger.info({ draftId, ttl: ttlSeconds }, 'Draft TTL refreshed');
  }

  async getRemainingTTL(draftId: string): Promise<number> {
    const key = this.getKey(draftId);
    const ttl = await this.redis.ttl(key);

    // -2 means key doesn't exist, -1 means no expiration set
    if (ttl === -2) {
      throw new NotFoundError(`Draft ${draftId} not found`);
    }

    return Math.max(0, ttl);
  }

  private getKey(draftId: string): string {
    return `${this.keyPrefix}${draftId}`;
  }

  /**
   * Serialize draft for storage (convert Dates to ISO strings)
   */
  private serialize(draft: DraftSite): any {
    return {
      ...draft,
      ttl: {
        createdAt: draft.ttl.createdAt.toISOString(),
        expiresAt: draft.ttl.expiresAt.toISOString(),
        lastAccessedAt: draft.ttl.lastAccessedAt.toISOString(),
      },
      config: {
        ...draft.config,
        metadata: {
          generatedAt: draft.config.metadata.generatedAt.toISOString(),
          lastModified: draft.config.metadata.lastModified.toISOString(),
        },
      },
    };
  }

  /**
   * Deserialize draft from storage (convert ISO strings to Dates)
   */
  private deserialize(data: any): DraftSite {
    return {
      ...data,
      ttl: {
        createdAt: new Date(data.ttl.createdAt),
        expiresAt: new Date(data.ttl.expiresAt),
        lastAccessedAt: new Date(data.ttl.lastAccessedAt),
      },
      config: {
        ...data.config,
        metadata: {
          generatedAt: new Date(data.config.metadata.generatedAt),
          lastModified: new Date(data.config.metadata.lastModified),
        },
      },
    };
  }
}
