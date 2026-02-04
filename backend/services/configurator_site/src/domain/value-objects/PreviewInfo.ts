/**
 * PreviewInfo Value Object
 * Represents preview metadata
 */

export interface PreviewInfoProps {
  mode: 'html' | 'json';
  url?: string;
  lastGeneratedAt?: Date;
  etag?: string;
}

export class PreviewInfo {
  private constructor(private readonly props: PreviewInfoProps) {}

  static create(props: PreviewInfoProps): PreviewInfo {
    return new PreviewInfo(props);
  }

  static empty(mode: 'html' | 'json' = 'html'): PreviewInfo {
    return new PreviewInfo({ mode });
  }

  getMode(): 'html' | 'json' {
    return this.props.mode;
  }

  getUrl(): string | undefined {
    return this.props.url;
  }

  getLastGeneratedAt(): Date | undefined {
    return this.props.lastGeneratedAt;
  }

  getEtag(): string | undefined {
    return this.props.etag;
  }

  withGenerated(url: string, etag: string): PreviewInfo {
    return new PreviewInfo({
      ...this.props,
      url,
      etag,
      lastGeneratedAt: new Date(),
    });
  }

  toJSON() {
    return {
      mode: this.props.mode,
      url: this.props.url,
      lastGeneratedAt: this.props.lastGeneratedAt?.toISOString(),
      etag: this.props.etag,
    };
  }

  static fromJSON(json: any): PreviewInfo {
    return PreviewInfo.create({
      mode: json.mode || 'html',
      url: json.url,
      lastGeneratedAt: json.lastGeneratedAt ? new Date(json.lastGeneratedAt) : undefined,
      etag: json.etag,
    });
  }
}

