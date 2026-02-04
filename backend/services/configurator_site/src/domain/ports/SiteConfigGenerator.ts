/**
 * SiteConfigGenerator Port
 * Interface for generating site configuration from draft
 */

import { SiteDraft } from '../entities/SiteDraft';
import { SiteConfig } from '../entities/SiteConfig';

export interface SiteConfigGenerator {
  /**
   * Generate a complete site configuration from a draft
   */
  generate(draft: SiteDraft): Promise<SiteConfig>;
}
