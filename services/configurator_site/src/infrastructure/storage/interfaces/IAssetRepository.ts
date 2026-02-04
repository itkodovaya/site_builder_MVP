/**
 * Asset repository interface for file storage
 */

import { Asset } from '../../../domain/entities/Asset.js';

export interface IAssetRepository {
  /**
   * Upload asset file
   */
  upload(
    file: Buffer,
    filename: string,
    mimeType: string,
    assetType: 'logo' | 'image' | 'icon',
    expiresAt?: Date
  ): Promise<Asset>;

  /**
   * Get asset by ID
   */
  get(assetId: string): Promise<Asset | null>;

  /**
   * Delete asset
   */
  delete(assetId: string): Promise<void>;

  /**
   * Copy asset to permanent storage
   */
  copyToPermanent(assetId: string): Promise<Asset>;

  /**
   * Check if asset exists
   */
  exists(assetId: string): Promise<boolean>;
}
