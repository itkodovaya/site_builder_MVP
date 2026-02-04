/**
 * FrappeMapper
 * Maps between domain models (SiteConfig) and Frappe format
 * 
 * This mapper ensures that our domain model remains independent
 * of Frappe's data structures
 */

import { SiteConfig } from '../../domain/entities/SiteConfig';
import {
  FrappeConfig,
  FrappePage,
  FrappeSection,
  FrappeTheme,
  FrappeBrand,
  FrappeAsset,
} from './FrappeTypes';

export class FrappeMapper {
  /**
   * Map SiteConfig to Frappe format
   */
  mapToFrappe(config: SiteConfig): FrappeConfig {
    const configJson = config.toJSON();

    return {
      pages: this.mapPages(configJson.pages),
      theme: this.mapTheme(configJson.theme),
      brand: this.mapBrand(configJson.brand),
      assets: this.mapAssets(configJson.assets),
    };
  }

  /**
   * Map pages to Frappe format
   */
  private mapPages(pages: any[]): FrappePage[] {
    return pages.map(page => ({
      id: page.id,
      path: page.path,
      title: page.title,
      sections: this.mapSections(page.sections),
      meta: {
        description: page.description,
        keywords: page.keywords,
      },
    }));
  }

  /**
   * Map sections to Frappe format
   */
  private mapSections(sections: any[]): FrappeSection[] {
    return sections.map(section => ({
      id: section.id,
      type: section.type,
      props: this.mapSectionProps(section.type, section.props),
      children: section.children ? this.mapSections(section.children) : undefined,
    }));
  }

  /**
   * Map section props based on section type
   * Different section types may have different prop structures in Frappe
   */
  private mapSectionProps(type: string, props: any): Record<string, any> {
    // Map common props
    const mapped: Record<string, any> = { ...props };

    // Section-specific mappings
    switch (type) {
      case 'hero':
        return {
          ...mapped,
          heading: props.headline || props.heading,
          subheading: props.subheadline || props.subheading,
          primaryButton: props.primaryCta ? {
            text: props.primaryCta.text,
            href: props.primaryCta.href,
          } : undefined,
          secondaryButton: props.secondaryCta ? {
            text: props.secondaryCta.text,
            href: props.secondaryCta.href,
          } : undefined,
        };

      case 'features':
      case 'services':
        return {
          ...mapped,
          heading: props.title || props.heading,
          items: props.items || [],
        };

      case 'contact':
        return {
          ...mapped,
          heading: props.title || props.heading,
          description: props.subtitle || props.description,
          fields: props.fields || ['name', 'email', 'message'],
        };

      default:
        return mapped;
    }
  }

  /**
   * Map theme to Frappe format
   */
  private mapTheme(theme: any): FrappeTheme {
    return {
      colors: {
        primary: theme.palette?.primary || '#025add',
        accent: theme.palette?.accent || '#4820a7',
        background: theme.palette?.background || '#ffffff',
        text: theme.palette?.text || '#111111',
        muted: theme.palette?.mutedText || '#5c667a',
      },
      fonts: {
        body: theme.typography?.fontFamily || 'system-ui, sans-serif',
        heading: theme.typography?.headingFont || theme.typography?.fontFamily,
      },
      spacing: {
        unit: 8,
        scale: this.mapSpacingScale(theme.spacing),
      },
      borderRadius: {
        small: this.mapRadius(theme.radius, 'small'),
        medium: this.mapRadius(theme.radius, 'medium'),
        large: this.mapRadius(theme.radius, 'large'),
      },
    };
  }

  /**
   * Map spacing scale to Frappe format
   */
  private mapSpacingScale(spacing?: string): 'compact' | 'normal' | 'relaxed' {
    switch (spacing) {
      case 'compact':
        return 'compact';
      case 'relaxed':
        return 'relaxed';
      default:
        return 'normal';
    }
  }

  /**
   * Map radius to Frappe format
   */
  private mapRadius(radius?: string, size?: 'small' | 'medium' | 'large'): string {
    const radiusMap: Record<string, Record<string, string>> = {
      none: { small: '0', medium: '0', large: '0' },
      sm: { small: '2px', medium: '4px', large: '6px' },
      md: { small: '4px', medium: '8px', large: '12px' },
      lg: { small: '8px', medium: '16px', large: '24px' },
      full: { small: '9999px', medium: '9999px', large: '9999px' },
    };

    const radiusKey = radius || 'md';
    const sizeKey = size || 'medium';
    return radiusMap[radiusKey]?.[sizeKey] || '8px';
  }

  /**
   * Map brand to Frappe format
   */
  private mapBrand(brand: any): FrappeBrand {
    return {
      name: brand.name,
      logo: brand.logo ? {
        url: brand.logo.url,
        alt: `${brand.name} logo`,
        width: brand.logo.width,
        height: brand.logo.height,
      } : undefined,
      tagline: brand.tagline,
    };
  }

  /**
   * Map assets to Frappe format
   */
  private mapAssets(assets?: any[]): FrappeAsset[] | undefined {
    if (!assets || assets.length === 0) {
      return undefined;
    }

    return assets.map(asset => ({
      id: asset.assetId,
      url: asset.url,
      type: this.mapAssetType(asset.type || asset.mimeType),
      metadata: {
        width: asset.width,
        height: asset.height,
        format: asset.mimeType,
        size: asset.bytes,
      },
    }));
  }

  /**
   * Map asset type to Frappe format
   */
  private mapAssetType(type: string): 'image' | 'video' | 'icon' {
    if (type.includes('image') || type.includes('logo')) {
      return 'image';
    }
    if (type.includes('video')) {
      return 'video';
    }
    return 'icon';
  }

  /**
   * Reverse mapping: Frappe format to domain model (if needed)
   */
  mapFromFrappe(frappeConfig: FrappeConfig): Partial<any> {
    // This could be implemented if we need to import Frappe configs
    // into our domain model
    return {
      pages: frappeConfig.pages.map(page => ({
        id: page.id,
        path: page.path,
        title: page.title,
        sections: page.sections.map(section => ({
          id: section.id,
          type: section.type,
          props: section.props,
        })),
      })),
      theme: {
        palette: {
          primary: frappeConfig.theme.colors.primary,
          accent: frappeConfig.theme.colors.accent,
          background: frappeConfig.theme.colors.background,
          text: frappeConfig.theme.colors.text,
        },
        typography: {
          fontFamily: frappeConfig.theme.fonts.body,
        },
      },
      brand: {
        name: frappeConfig.brand.name,
        logo: frappeConfig.brand.logo ? {
          url: frappeConfig.brand.logo.url,
        } : undefined,
      },
    };
  }
}

