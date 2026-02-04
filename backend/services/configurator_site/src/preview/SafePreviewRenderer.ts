/**
 * Safe Preview Renderer
 * Renders previews with security guarantees:
 * - Whitelist of section types
 * - HTML escaping of all user inputs
 * - No arbitrary HTML/JS execution
 * - Built-in template components only
 * - Optional Frappe integration for enhanced rendering
 */

import { SiteConfig } from '../domain/entities/SiteConfig';
import { escapeHtml, escapeHtmlInObject, containsUnsafeContent } from '../lib/html-escape';
import { generateConfigETag } from '../lib/etag';
import { sanitizeHtml, validateHtml } from '../lib/html-sanitizer';
import { FrappeAdapter } from '../domain/ports/FrappeAdapter';

// Whitelist of allowed section types
const ALLOWED_SECTION_TYPES = new Set([
  'hero',
  'features',
  'about',
  'contact',
  'services',
  'gallery',
  'testimonials',
  'pricing',
  'faq',
  'team',
  'footer',
]);

export interface PreviewHtmlOutput {
  type: 'html';
  content: string;
  generatedAt: string;
  etag: string;
}

export interface PreviewJsonOutput {
  type: 'json';
  model: any;
  generatedAt: string;
  etag: string;
}

export type PreviewOutput = PreviewHtmlOutput | PreviewJsonOutput;

export class SafePreviewRenderer {
  constructor(
    private readonly frappeAdapter?: FrappeAdapter
  ) {}

  /**
   * Render preview in specified format
   * Ensures all user inputs are escaped and safe
   * Uses Frappe if available, falls back to built-in renderer
   */
  async render(
    config: SiteConfig,
    format: 'html' | 'json'
  ): Promise<PreviewOutput> {
    const configJson = config.toJSON();
    const generatedAt = new Date().toISOString();
    const etag = generateConfigETag(configJson);

    if (format === 'json') {
      return this.renderJsonPreview(configJson, generatedAt, etag);
    }

    return this.renderHtmlPreview(configJson, generatedAt, etag);
  }

  /**
   * Render JSON preview model
   * Returns safe, escaped data for frontend rendering
   */
  private renderJsonPreview(
    configJson: any,
    generatedAt: string,
    etag: string
  ): PreviewJsonOutput {
    // Validate and filter sections
    const safePages = configJson.pages.map((page: any) => ({
      ...page,
      sections: page.sections
        .filter((section: any) => this.isSectionAllowed(section))
        .map((section: any) => this.sanitizeSection(section)),
    }));

    return {
      type: 'json',
      model: {
        schemaVersion: configJson.schemaVersion,
        brand: configJson.brand,
        theme: configJson.theme,
        pages: safePages,
      },
      generatedAt,
      etag,
    };
  }

  /**
   * Render HTML preview
   * Server-side rendering with escaped content
   * Uses Frappe if available, falls back to built-in renderer
   */
  private async renderHtmlPreview(
    configJson: any,
    generatedAt: string,
    etag: string
  ): Promise<PreviewHtmlOutput> {
    let html: string;

    // Try Frappe renderer first if available
    if (this.frappeAdapter && this.frappeAdapter.isAvailable()) {
      try {
        console.log('[SafePreviewRenderer] Using Frappe for rendering');
        
        // Create SiteConfig from JSON for Frappe
        const config = this.createConfigFromJson(configJson);
        
        // Render with Frappe
        html = await this.frappeAdapter.renderHtml(config);
        
        // Sanitize Frappe output
        html = sanitizeHtml(html);
        
        // Validate sanitized HTML
        const validation = validateHtml(html);
        if (!validation.valid) {
          console.warn('[SafePreviewRenderer] Frappe output validation failed:', validation.errors);
          throw new Error('Frappe output validation failed');
        }
      } catch (error) {
        console.error('[SafePreviewRenderer] Frappe rendering failed, falling back to built-in renderer:', error);
        // Fall back to built-in renderer
        html = this.buildHtmlDocument(configJson.brand, configJson.theme, configJson.pages);
      }
    } else {
      // Use built-in renderer
      const { brand, theme, pages } = configJson;
      html = this.buildHtmlDocument(brand, theme, pages);
    }

    return {
      type: 'html',
      content: html,
      generatedAt,
      etag,
    };
  }

  /**
   * Create SiteConfig instance from JSON
   * Helper for Frappe integration
   */
  private createConfigFromJson(configJson: any): SiteConfig {
    // This assumes SiteConfig has a fromJSON method
    // If not, adjust based on actual SiteConfig structure
    return Object.assign(Object.create(SiteConfig.prototype), configJson);
  }

  /**
   * Build complete HTML document
   * All user inputs are escaped
   */
  private buildHtmlDocument(brand: any, theme: any, pages: any[]): string {
    const brandName = escapeHtml(brand.name);
    const palette = theme.palette;

    // Get home page sections
    const homePage = pages.find(p => p.id === 'home') || pages[0];
    const sections = homePage?.sections || [];

    // Render sections
    const sectionsHtml = sections
      .filter((section: any) => this.isSectionAllowed(section))
      .map((section: any) => this.renderSection(section, brand, theme))
      .join('\n');

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${theme.typography.fontFamily};
      line-height: 1.6;
      color: ${palette.text};
      background: ${palette.background};
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    .section {
      padding: 4rem 0;
    }
    
    .hero {
      background: linear-gradient(135deg, ${palette.primary}, ${palette.accent});
      color: white;
      text-align: center;
      padding: 6rem 0;
    }
    
    .hero h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    .hero p {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    
    .cta-button {
      display: inline-block;
      padding: 1rem 2rem;
      background: white;
      color: ${palette.primary};
      text-decoration: none;
      border-radius: ${this.getRadiusValue(theme.radius)};
      font-weight: bold;
      margin: 0 0.5rem;
      transition: transform 0.2s;
    }
    
    .cta-button:hover {
      transform: scale(1.05);
    }
    
    .section-title {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 3rem;
      color: ${palette.primary};
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }
    
    .feature-card {
      padding: 2rem;
      background: ${palette.surface};
      border-radius: ${this.getRadiusValue(theme.radius)};
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    .feature-card h3 {
      color: ${palette.primary};
      margin-bottom: 1rem;
    }
    
    .about {
      background: ${palette.surface};
    }
    
    .about p {
      text-align: center;
      font-size: 1.125rem;
      max-width: 800px;
      margin: 0 auto;
      color: ${palette.mutedText};
    }
    
    .contact {
      text-align: center;
    }
    
    .contact-subtitle {
      color: ${palette.mutedText};
      margin-bottom: 2rem;
    }
    
    footer {
      background: ${palette.primary};
      color: white;
      text-align: center;
      padding: 2rem 0;
      margin-top: 4rem;
    }
  </style>
</head>
<body>
  ${sectionsHtml}
</body>
</html>`;
  }

  /**
   * Render individual section
   * Uses predefined templates, escapes all content
   */
  private renderSection(section: any, brand: any, theme: any): string {
    const safeSection = this.sanitizeSection(section);
    const props = safeSection.props;

    switch (section.type) {
      case 'hero':
        return this.renderHeroSection(props, brand);
      
      case 'features':
      case 'services':
        return this.renderFeaturesSection(props);
      
      case 'about':
        return this.renderAboutSection(props);
      
      case 'contact':
        return this.renderContactSection(props);
      
      case 'footer':
        return this.renderFooterSection(props);
      
      default:
        // Unknown section type - skip
        return '';
    }
  }

  private renderHeroSection(props: any, brand: any): string {
    const headline = escapeHtml(props.headline || '');
    const subheadline = escapeHtml(props.subheadline || '');
    const primaryCta = props.primaryCta;
    const secondaryCta = props.secondaryCta;
    const logoUrl = brand.logo?.url ? escapeHtml(brand.logo.url) : '';

    return `
  <section class="hero">
    <div class="container">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height: 80px; margin-bottom: 2rem;">` : ''}
      <h1>${headline}</h1>
      <p>${subheadline}</p>
      <div>
        ${primaryCta ? `<a href="${escapeHtml(primaryCta.href)}" class="cta-button">${escapeHtml(primaryCta.text)}</a>` : ''}
        ${secondaryCta ? `<a href="${escapeHtml(secondaryCta.href)}" class="cta-button">${escapeHtml(secondaryCta.text)}</a>` : ''}
      </div>
    </div>
  </section>`;
  }

  private renderFeaturesSection(props: any): string {
    const title = escapeHtml(props.title || '');
    const items = Array.isArray(props.items) ? props.items : [];

    const itemsHtml = items
      .map((item: any) => `
        <div class="feature-card">
          <h3>${escapeHtml(item.title || '')}</h3>
          <p>${escapeHtml(item.text || item.description || '')}</p>
        </div>
      `)
      .join('');

    return `
  <section class="section">
    <div class="container">
      <h2 class="section-title">${title}</h2>
      <div class="features-grid">
        ${itemsHtml}
      </div>
    </div>
  </section>`;
  }

  private renderAboutSection(props: any): string {
    const title = escapeHtml(props.title || '');
    const text = escapeHtml(props.text || props.body || '');

    return `
  <section class="section about">
    <div class="container">
      <h2 class="section-title">${title}</h2>
      <p>${text}</p>
    </div>
  </section>`;
  }

  private renderContactSection(props: any): string {
    const title = escapeHtml(props.title || '');
    const subtitle = escapeHtml(props.subtitle || '');

    return `
  <section class="section contact">
    <div class="container">
      <h2 class="section-title">${title}</h2>
      <p class="contact-subtitle">${subtitle}</p>
      <p style="color: #6c757d;">Форма обратной связи будет добавлена после публикации.</p>
    </div>
  </section>`;
  }

  private renderFooterSection(props: any): string {
    const copyright = escapeHtml(props.copyright || '');

    return `
  <footer>
    <div class="container">
      <p>${copyright}</p>
    </div>
  </footer>`;
  }

  /**
   * Check if section type is allowed (whitelist)
   */
  private isSectionAllowed(section: any): boolean {
    return ALLOWED_SECTION_TYPES.has(section.type);
  }

  /**
   * Sanitize section by escaping all string props
   * Also validates for unsafe content
   */
  private sanitizeSection(section: any): any {
    // Check for unsafe content in any string values
    const jsonString = JSON.stringify(section);
    if (containsUnsafeContent(jsonString)) {
      throw new Error(`Unsafe content detected in section ${section.id}`);
    }

    return {
      ...section,
      props: escapeHtmlInObject(section.props),
    };
  }

  /**
   * Convert radius value to CSS
   */
  private getRadiusValue(radius: string): string {
    const radiusMap: Record<string, string> = {
      'none': '0',
      'sm': '4px',
      'md': '8px',
      'lg': '16px',
      'full': '9999px',
    };
    return radiusMap[radius] || '8px';
  }
}

