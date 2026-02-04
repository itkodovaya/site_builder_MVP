/**
 * Draft repository interface for temporary storage
 */

import { DraftSite } from '../../../domain/entities/DraftSite.js';

export interface IDraftRepository {
  /**
   * Create a new draft
   */
  create(draft: DraftSite): Promise<string>;

  /**
   * Get draft by ID
   */
  get(draftId: string): Promise<DraftSite | null>;

  /**
   * Update existing draft
   */
  update(draftId: string, draft: DraftSite): Promise<void>;

  /**
   * Delete draft
   */
  delete(draftId: string): Promise<void>;

  /**
   * Check if draft exists
   */
  exists(draftId: string): Promise<boolean>;

  /**
   * Refresh TTL for a draft (optional, depends on storage backend)
   */
  refreshTTL?(draftId: string, ttlSeconds: number): Promise<void>;

  /**
   * Get remaining TTL in seconds
   */
  getRemainingTTL?(draftId: string): Promise<number>;
}
