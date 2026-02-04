/**
 * Interface for permanent site storage
 */

import { PublishedSite } from '../../../domain/entities/PublishedSite.js';

export interface ISiteRepository {
  /**
   * Create a new published site
   */
  create(site: PublishedSite): Promise<string>;

  /**
   * Get site by ID
   */
  get(siteId: string): Promise<PublishedSite | null>;

  /**
   * Get site by User ID
   */
  getByUserId(userId: string): Promise<PublishedSite[]>;

  /**
   * Update site configuration
   */
  updateConfig(siteId: string, config: any): Promise<void>;
}
