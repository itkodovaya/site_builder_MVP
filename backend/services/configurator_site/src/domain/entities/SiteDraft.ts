/**
 * SiteDraft Entity
 * Represents a temporary website draft with TTL
 */

import { DraftId } from '../value-objects/DraftId';
import { BrandProfile } from './BrandProfile';
import { GeneratorInfo } from '../value-objects/GeneratorInfo';
import { PreviewInfo } from '../value-objects/PreviewInfo';
import { DraftMeta } from '../value-objects/DraftMeta';

export class SiteDraft {
  constructor(
    public readonly schemaVersion: number,
    public readonly draftId: DraftId,
    public readonly status: 'DRAFT' | 'PUBLISHED',
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly expiresAt: Date,
    public readonly ttlSeconds: number,
    public readonly brandProfile: BrandProfile,
    public readonly generator: GeneratorInfo,
    public readonly preview: PreviewInfo,
    public readonly meta: DraftMeta
  ) {
    // Validate required fields
    if (!brandProfile.brandName || brandProfile.brandName.trim().length === 0) {
      throw new Error('Brand name is required');
    }
    if (ttlSeconds <= 0) {
      throw new Error('TTL must be positive');
    }
  }

  /**
   * Check if draft is expired
   */
  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  /**
   * Create updated draft with new brand profile
   * Refreshes updatedAt and expiresAt (sliding TTL)
   */
  update(newBrandProfile: BrandProfile): SiteDraft {
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + this.ttlSeconds * 1000);

    return new SiteDraft(
      this.schemaVersion,
      this.draftId,
      this.status,
      this.createdAt,
      now, // updatedAt
      newExpiresAt, // expiresAt (refreshed)
      this.ttlSeconds,
      newBrandProfile,
      this.generator,
      this.preview,
      this.meta
    );
  }

  /**
   * Update preview info (after preview generation)
   */
  updatePreview(previewInfo: PreviewInfo): SiteDraft {
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + this.ttlSeconds * 1000);

    return new SiteDraft(
      this.schemaVersion,
      this.draftId,
      this.status,
      this.createdAt,
      now, // updatedAt
      newExpiresAt, // expiresAt (refreshed on preview activity)
      this.ttlSeconds,
      this.brandProfile,
      this.generator,
      previewInfo,
      this.meta
    );
  }

  /**
   * Convert to JSON (for storage/API)
   */
  toJSON(): any {
    return {
      schemaVersion: this.schemaVersion,
      draftId: this.draftId.toString(),
      status: this.status,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
      ttlSeconds: this.ttlSeconds,
      brandProfile: this.brandProfile.toJSON(),
      generator: this.generator.toJSON(),
      preview: this.preview.toJSON(),
      meta: this.meta.toJSON(),
    };
  }

  /**
   * Create from JSON (for deserialization)
   */
  static fromJSON(json: any): SiteDraft {
    return new SiteDraft(
      json.schemaVersion,
      DraftId.fromString(json.draftId),
      json.status,
      new Date(json.createdAt),
      new Date(json.updatedAt),
      new Date(json.expiresAt),
      json.ttlSeconds,
      BrandProfile.fromJSON(json.brandProfile),
      GeneratorInfo.fromJSON(json.generator),
      PreviewInfo.fromJSON(json.preview),
      DraftMeta.fromJSON(json.meta)
    );
  }
}
