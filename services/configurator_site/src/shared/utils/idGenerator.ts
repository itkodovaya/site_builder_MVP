/**
 * ID generator utility
 */

import { v4 as uuidv4 } from 'uuid';

export class IdGenerator {
  static generateDraftId(): string {
    return `draft-${uuidv4()}`;
  }

  static generateSiteId(): string {
    return `site-${uuidv4()}`;
  }

  static generateAssetId(): string {
    return `asset-${uuidv4()}`;
  }

  static generateSectionId(): string {
    return `section-${uuidv4()}`;
  }

  static generateId(): string {
    return uuidv4();
  }
}
