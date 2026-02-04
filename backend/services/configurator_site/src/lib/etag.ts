/**
 * ETag Generation
 * Creates stable cache identifiers for preview content
 */

import crypto from 'crypto';

/**
 * Generate ETag from config ID and content hash
 * Format: W/"configId:contentHash"
 */
export function generateETag(configId: string, content: string): string {
  const contentHash = hashContent(content);
  return `W/"${configId}:${contentHash}"`;
}

/**
 * Generate ETag from SiteConfig
 * Uses configId + hash of JSON representation
 */
export function generateConfigETag(configJson: any): string {
  const configId = configJson.configId;
  const contentHash = hashContent(JSON.stringify(configJson));
  return `W/"${configId}:${contentHash}"`;
}

/**
 * Hash content using SHA256 (first 16 chars)
 */
function hashContent(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Compare ETags
 */
export function etagsMatch(etag1: string, etag2: string): boolean {
  return etag1 === etag2;
}

