/**
 * Core SiteConfig entity representing the complete site configuration
 */

export interface SiteConfig {
  configVersion: string;
  brandName: string;
  industry: Industry;
  branding: Branding;
  theme: Theme;
  pages: Page[];
  metadata: ConfigMetadata;
}

export interface Industry {
  category: string;
  subcategory: string;
  tags?: string[];
}

export interface Branding {
  logo: Logo;
  colors: ColorPalette;
  typography: Typography;
}

export interface Logo {
  assetId: string;
  url: string;
  format: 'png' | 'jpeg' | 'svg' | 'webp';
  dimensions: {
    width: number;
    height: number;
  };
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface Typography {
  headingFont: string;
  bodyFont: string;
}

export interface Theme {
  templateId: 'default' | 'minimal' | 'modern';
  style: 'light' | 'dark' | 'auto';
}

export interface Page {
  id: string;
  name: string;
  sections: Section[];
}

export interface Section {
  id: string;
  type: string;
  order: number;
  content: Record<string, any>;
}

export interface ConfigMetadata {
  generatedAt: Date;
  lastModified: Date;
}

/**
 * Factory functions for creating SiteConfig
 */
export class SiteConfigFactory {
  static create(
    brandName: string,
    industry: Industry,
    logo: Logo,
    theme?: Partial<Theme>
  ): SiteConfig {
    const defaultColors = this.generateDefaultColors(theme?.style || 'light');
    const defaultTypography = this.getDefaultTypography();

    return {
      configVersion: '1.0.0',
      brandName,
      industry,
      branding: {
        logo,
        colors: defaultColors,
        typography: defaultTypography,
      },
      theme: {
        templateId: theme?.templateId || 'default',
        style: theme?.style || 'light',
      },
      pages: this.createDefaultPages(brandName, industry),
      metadata: {
        generatedAt: new Date(),
        lastModified: new Date(),
      },
    };
  }

  static update(
    existing: SiteConfig,
    updates: Partial<SiteConfig>
  ): SiteConfig {
    return {
      ...existing,
      ...updates,
      metadata: {
        generatedAt: existing.metadata.generatedAt,
        lastModified: new Date(),
      },
    };
  }

  private static generateDefaultColors(style: 'light' | 'dark' | 'auto'): ColorPalette {
    if (style === 'dark') {
      return {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#f59e0b',
        background: '#0f172a',
        text: '#f1f5f9',
      };
    }

    // Light mode (default)
    return {
      primary: '#2563eb',
      secondary: '#7c3aed',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#1f2937',
    };
  }

  private static getDefaultTypography(): Typography {
    return {
      headingFont: 'Inter',
      bodyFont: 'Inter',
    };
  }

  private static createDefaultPages(brandName: string, industry: Industry): Page[] {
    return [
      {
        id: 'home',
        name: 'home',
        sections: [
          {
            id: 'hero-1',
            type: 'hero',
            order: 1,
            content: {
              headline: `Welcome to ${brandName}`,
              subheadline: `${industry.category} solutions for modern businesses`,
              ctaText: 'Get Started',
              ctaLink: '#contact',
            },
          },
          {
            id: 'features-1',
            type: 'features',
            order: 2,
            content: {
              title: 'Our Services',
              features: [
                { title: 'Quality', description: 'Premium service quality' },
                { title: 'Innovation', description: 'Cutting-edge solutions' },
                { title: 'Support', description: '24/7 customer support' },
              ],
            },
          },
          {
            id: 'cta-1',
            type: 'cta',
            order: 3,
            content: {
              title: 'Ready to get started?',
              description: 'Join us today and transform your business',
              ctaText: 'Contact Us',
              ctaLink: '#contact',
            },
          },
        ],
      },
    ];
  }
}
