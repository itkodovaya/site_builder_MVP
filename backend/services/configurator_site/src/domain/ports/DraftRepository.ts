/**
 * DraftRepository Port
 * Interface for draft persistence with TTL support
 */

import { SiteDraft } from '../entities/SiteDraft';
import { DraftId } from '../value-objects/DraftId';

export interface DraftRepository {
  /**
   * Save a draft with TTL
   */
  save(draft: SiteDraft): Promise<void>;

  /**
   * Update an existing draft with TTL refresh (sliding TTL)
   */
  update(draft: SiteDraft): Promise<void>;

  /**
   * Find a draft by ID
   * @param id - Draft ID
   * @param refreshTtl - If true, refresh TTL (activity tracking)
   * Returns null if not found or expired
   */
  findById(id: DraftId, refreshTtl?: boolean): Promise<SiteDraft | null>;

  /**
   * Check if a draft exists
   */
  exists(id: DraftId): Promise<boolean>;

  /**
   * Delete a draft
   */
  delete(id: DraftId): Promise<void>;

  /**
   * Get remaining TTL in seconds
   * Returns null if draft doesn't exist
   */
  getTTL(id: DraftId): Promise<number | null>;
}
