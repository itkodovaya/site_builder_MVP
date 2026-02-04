/**
 * DraftSite entity - Temporary/anonymous site configuration with TTL
 */

import { SiteConfig } from './SiteConfig.js';

export interface DraftSite {
  draftId: string;
  config: SiteConfig;
  status: DraftStatus;
  ttl: TTLInfo;
  metadata: DraftMetadata;
}

export type DraftStatus = 'draft' | 'processing' | 'ready';

export interface TTLInfo {
  createdAt: Date;
  expiresAt: Date;
  lastAccessedAt: Date;
}

export interface DraftMetadata {
  createdFrom: 'web' | 'api' | 'mobile';
  ipAddress?: string;
  sessionId?: string;
}

export class DraftSiteFactory {
  static create(
    draftId: string,
    config: SiteConfig,
    ttlSeconds: number,
    metadata: DraftMetadata
  ): DraftSite {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    return {
      draftId,
      config,
      status: 'ready',
      ttl: {
        createdAt: now,
        expiresAt,
        lastAccessedAt: now,
      },
      metadata,
    };
  }

  static refreshTTL(draft: DraftSite, ttlSeconds: number): DraftSite {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    return {
      ...draft,
      ttl: {
        ...draft.ttl,
        expiresAt,
        lastAccessedAt: now,
      },
    };
  }

  static updateConfig(draft: DraftSite, config: SiteConfig): DraftSite {
    return {
      ...draft,
      config,
      ttl: {
        ...draft.ttl,
        lastAccessedAt: new Date(),
      },
    };
  }

  static getRemainingSeconds(draft: DraftSite): number {
    const now = Date.now();
    const expiresAt = draft.ttl.expiresAt.getTime();
    const remaining = Math.floor((expiresAt - now) / 1000);
    return Math.max(0, remaining);
  }

  static isExpired(draft: DraftSite): boolean {
    return this.getRemainingSeconds(draft) <= 0;
  }
}
