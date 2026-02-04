/**
 * PublishedSite entity - Permanent site after user registration
 */

import { SiteConfig } from './SiteConfig.js';

export interface PublishedSite {
  siteId: string;
  userId: string;
  config: SiteConfig;
  status: SiteStatus;
  ownership: OwnershipInfo;
  metadata: SiteMetadata;
}

export type SiteStatus = 'migrated' | 'published' | 'archived';

export interface OwnershipInfo {
  ownerId: string;
  createdAt: Date;
  migratedFrom?: string;
}

export interface SiteMetadata {
  publishedAt?: Date;
  lastUpdatedAt: Date;
}

export class PublishedSiteFactory {
  static createFromDraft(
    siteId: string,
    userId: string,
    config: SiteConfig,
    draftId?: string
  ): PublishedSite {
    const now = new Date();

    return {
      siteId,
      userId,
      config,
      status: 'migrated',
      ownership: {
        ownerId: userId,
        createdAt: now,
        migratedFrom: draftId,
      },
      metadata: {
        lastUpdatedAt: now,
      },
    };
  }

  static publish(site: PublishedSite): PublishedSite {
    return {
      ...site,
      status: 'published',
      metadata: {
        ...site.metadata,
        publishedAt: new Date(),
      },
    };
  }
}
