/**
 * Asset entity - Logo and image files
 */

export interface Asset {
  assetId: string;
  type: AssetType;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  dimensions?: AssetDimensions;
  storage: StorageInfo;
  uploadedAt: Date;
  expiresAt?: Date;
}

export type AssetType = 'logo' | 'image' | 'icon';

export interface AssetDimensions {
  width: number;
  height: number;
}

export interface StorageInfo {
  bucket: string;
  key: string;
  url: string;
}

export class AssetFactory {
  static create(
    assetId: string,
    type: AssetType,
    filename: string,
    mimeType: string,
    sizeBytes: number,
    storage: StorageInfo,
    dimensions?: AssetDimensions,
    expiresAt?: Date
  ): Asset {
    return {
      assetId,
      type,
      filename,
      mimeType,
      sizeBytes,
      dimensions,
      storage,
      uploadedAt: new Date(),
      expiresAt,
    };
  }

  static getFormatFromMimeType(mimeType: string): 'png' | 'jpeg' | 'svg' | 'webp' {
    const formats: Record<string, 'png' | 'jpeg' | 'svg' | 'webp'> = {
      'image/png': 'png',
      'image/jpeg': 'jpeg',
      'image/jpg': 'jpeg',
      'image/svg+xml': 'svg',
      'image/webp': 'webp',
    };

    return formats[mimeType] || 'png';
  }
}
