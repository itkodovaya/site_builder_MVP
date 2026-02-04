/**
 * AssetInfo Value Object
 * Represents detailed asset information including dimensions and hash
 */

export interface AssetInfoProps {
  assetId: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  bytes: number;
  sha256: string;
  uploadedAt: Date;
}

export class AssetInfo {
  private constructor(private readonly props: AssetInfoProps) {
    this.validate();
  }

  static create(props: AssetInfoProps): AssetInfo {
    return new AssetInfo(props);
  }

  getAssetId(): string {
    return this.props.assetId;
  }

  getUrl(): string {
    return this.props.url;
  }

  getMimeType(): string {
    return this.props.mimeType;
  }

  getWidth(): number | undefined {
    return this.props.width;
  }

  getHeight(): number | undefined {
    return this.props.height;
  }

  getBytes(): number {
    return this.props.bytes;
  }

  getSha256(): string {
    return this.props.sha256;
  }

  getUploadedAt(): Date {
    return this.props.uploadedAt;
  }

  toJSON() {
    return {
      assetId: this.props.assetId,
      url: this.props.url,
      mimeType: this.props.mimeType,
      width: this.props.width,
      height: this.props.height,
      bytes: this.props.bytes,
      sha256: this.props.sha256,
      uploadedAt: this.props.uploadedAt.toISOString(),
    };
  }

  static fromJSON(json: any): AssetInfo {
    return AssetInfo.create({
      assetId: json.assetId,
      url: json.url,
      mimeType: json.mimeType,
      width: json.width,
      height: json.height,
      bytes: json.bytes,
      sha256: json.sha256,
      uploadedAt: new Date(json.uploadedAt),
    });
  }

  private validate(): void {
    if (!this.props.assetId) {
      throw new Error('AssetInfo must have an assetId');
    }
    if (!this.props.url) {
      throw new Error('AssetInfo must have a url');
    }
    if (!this.props.mimeType) {
      throw new Error('AssetInfo must have a mimeType');
    }
    if (this.props.bytes < 0) {
      throw new Error('AssetInfo bytes must be non-negative');
    }
    if (!this.props.sha256) {
      throw new Error('AssetInfo must have a sha256 hash');
    }
  }
}

