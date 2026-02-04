/**
 * Mock AssetStorage Implementation
 * For MVP/testing - to be replaced with S3-based implementation
 */

import { AssetStorage, AssetMetadata } from '../../domain/ports/AssetStorage';
import { AssetInfo } from '../../domain/value-objects/AssetInfo';
import crypto from 'crypto';

export class MockAssetStorage implements AssetStorage {
  private assets: Map<string, { buffer: Buffer; metadata: AssetMetadata }> = new Map();

  async store(buffer: Buffer, metadata: AssetMetadata): Promise<string> {
    const assetId = this.generateAssetId();
    this.assets.set(assetId, { buffer, metadata });
    return assetId;
  }

  async getUrl(assetId: string): Promise<string> {
    // Mock URL - in real implementation, would return CDN URL
    return `https://cdn.example.com/assets/${assetId}`;
  }

  async getAssetInfo(assetId: string): Promise<AssetInfo | null> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      return null;
    }

    const url = await this.getUrl(assetId);
    const sha256 = crypto.createHash('sha256').update(asset.buffer).digest('hex');

    return new AssetInfo(
      assetId,
      url,
      asset.metadata.mimeType,
      null, // width - would be extracted from image in real implementation
      null, // height - would be extracted from image in real implementation
      asset.metadata.size,
      sha256,
      asset.metadata.uploadedAt
    );
  }

  async exists(assetId: string): Promise<boolean> {
    return this.assets.has(assetId);
  }

  async delete(assetId: string): Promise<void> {
    this.assets.delete(assetId);
  }

  private generateAssetId(): string {
    return `ast_${crypto.randomBytes(8).toString('hex')}`;
  }
}

