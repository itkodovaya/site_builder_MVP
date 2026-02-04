/**
 * AssetStorage Port
 * Interface for storing and retrieving assets (logos, images)
 */

import { AssetInfo } from '../value-objects/AssetInfo';

export interface AssetMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface AssetStorage {
  /**
   * Store an asset and return its reference/key
   */
  store(buffer: Buffer, metadata: AssetMetadata): Promise<string>;

  /**
   * Get the public URL for an asset
   */
  getUrl(ref: string): Promise<string>;

  /**
   * Get full asset info (for draft creation/update)
   * Returns null if asset doesn't exist
   */
  getAssetInfo(assetId: string): Promise<AssetInfo | null>;

  /**
   * Check if an asset exists
   */
  exists(ref: string): Promise<boolean>;

  /**
   * Delete an asset
   */
  delete(ref: string): Promise<void>;
}

