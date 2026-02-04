/**
 * SiteConfig Entity
 * Publish-ready website configuration
 */

import { GeneratorInfo } from '../value-objects/GeneratorInfo';

export interface ThemePalette {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
}

export interface Typography {
  fontFamily: string;
  scale: 'sm' | 'md' | 'lg';
}

export interface ThemeConfig {
  themeId: string;
  palette: ThemePalette;
  typography: Typography;
  radius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  spacing: 'compact' | 'md' | 'relaxed';
}

export interface BrandInfo {
  name: string;
  industry: {
    code: string;
    label: string;
  };
  slug: string;
  logo?: {
    assetId: string;
    url: string;
  };
}

export interface RoutingConfig {
  basePath: string;
  trailingSlash: boolean;
}

export interface SEOInfo {
  title: string;
  description: string;
  ogImageAssetId?: string | null;
}

export interface SiteInfo {
  language: string;
  title: string;
  description: string;
  routing: RoutingConfig;
  seo: SEOInfo;
}

export interface CTAButton {
  text: string;
  href: string;
}

export interface SectionProps {
  id: string;
  type: string;
  props: Record<string, any>;
}

export interface PageConfig {
  id: string;
  path: string;
  title: string;
  sections: SectionProps[];
}

export interface AssetConfig {
  assetId: string;
  type: string;
  mimeType: string;
  url: string;
  bytes?: number;
  sha256?: string;
}

export interface PublishingConfig {
  target: 'static' | 'dynamic';
  output: {
    format: 'html' | 'react' | 'vue';
    entryPageId: string;
  };
  constraints: {
    maxPages: number;
    maxSectionsPerPage: number;
  };
}

export interface GeneratorMetadata {
  engine: string;
  engineVersion: string;
  templateId: string;
  templateVersion: number;
}

export interface SiteConfigProps {
  schemaVersion: number;
  configVersion: string;
  configId: string;
  draftId: string;
  generatedAt: Date;
  generator: GeneratorMetadata;
  brand: BrandInfo;
  site: SiteInfo;
  theme: ThemeConfig;
  pages: PageConfig[];
  assets: AssetConfig[];
  publishing: PublishingConfig;
}

export class SiteConfig {
  private constructor(private readonly props: SiteConfigProps) {
    this.validate();
  }

  static create(props: SiteConfigProps): SiteConfig {
    return new SiteConfig(props);
  }

  getSchemaVersion(): number {
    return this.props.schemaVersion;
  }

  getConfigVersion(): string {
    return this.props.configVersion;
  }

  getConfigId(): string {
    return this.props.configId;
  }

  getDraftId(): string {
    return this.props.draftId;
  }

  getGeneratedAt(): Date {
    return this.props.generatedAt;
  }

  getGenerator(): GeneratorMetadata {
    return this.props.generator;
  }

  getBrand(): BrandInfo {
    return this.props.brand;
  }

  getSite(): SiteInfo {
    return this.props.site;
  }

  getTheme(): ThemeConfig {
    return this.props.theme;
  }

  getPages(): PageConfig[] {
    return this.props.pages;
  }

  getAssets(): AssetConfig[] {
    return this.props.assets;
  }

  getPublishing(): PublishingConfig {
    return this.props.publishing;
  }

  toJSON() {
    return {
      schemaVersion: this.props.schemaVersion,
      configVersion: this.props.configVersion,
      configId: this.props.configId,
      draftId: this.props.draftId,
      generatedAt: this.props.generatedAt.toISOString(),
      generator: this.props.generator,
      brand: this.props.brand,
      site: this.props.site,
      theme: this.props.theme,
      pages: this.props.pages,
      assets: this.props.assets,
      publishing: this.props.publishing,
    };
  }

  private validate(): void {
    if (!this.props.configId) {
      throw new Error('SiteConfig must have a configId');
    }
    if (!this.props.draftId) {
      throw new Error('SiteConfig must have a draftId');
    }
    if (!this.props.generator) {
      throw new Error('SiteConfig must have generator info');
    }
    if (!this.props.brand) {
      throw new Error('SiteConfig must have brand info');
    }
    if (!this.props.theme) {
      throw new Error('SiteConfig must have theme info');
    }
    if (!this.props.site) {
      throw new Error('SiteConfig must have site info');
    }
  }
}
