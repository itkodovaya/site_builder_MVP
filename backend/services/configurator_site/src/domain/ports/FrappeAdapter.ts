/**
 * FrappeAdapter Port
 * Interface for abstracting Frappe functionality (rendering, page building, validation)
 * 
 * This port allows the configurator to use Frappe as a rendering engine
 * while maintaining independence from Frappe's implementation details.
 * Frappe can be replaced with an alternative implementation without changing
 * the domain or application layers.
 */

import { SiteConfig } from '../entities/SiteConfig';

/**
 * Token context for template resolution
 */
export interface TokenContext {
  brandName: string;
  industryLabel: string;
  logoUrl?: string;
  slug: string;
  [key: string]: any;
}

/**
 * Page structure returned by Frappe page builder
 */
export interface PageStructure {
  pages: Array<{
    id: string;
    path: string;
    title: string;
    sections: Array<{
      id: string;
      type: string;
      props: Record<string, any>;
    }>;
  }>;
}

/**
 * Template definition for Frappe
 */
export interface TemplateDefinition {
  templateId: string;
  templateVersion: number;
  defaults: {
    theme: any;
    seo: any;
  };
  pages: any[];
}

/**
 * Validation result from Frappe
 */
export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * FrappeAdapter interface
 * Abstracts Frappe functionality for rendering and config generation
 */
export interface FrappeAdapter {
  /**
   * Render HTML from SiteConfig using Frappe SSR
   * @param config - Site configuration to render
   * @returns Rendered HTML string
   */
  renderHtml(config: SiteConfig): Promise<string>;

  /**
   * Generate page structure from template using Frappe page builder
   * @param template - Template definition
   * @param tokens - Token context for resolution
   * @returns Generated page structure
   */
  generatePageStructure(
    template: TemplateDefinition,
    tokens: TokenContext
  ): Promise<PageStructure>;

  /**
   * Validate configuration through Frappe
   * @param config - Site configuration to validate
   * @returns Validation result
   */
  validateConfig(config: SiteConfig): Promise<ValidationResult>;

  /**
   * Check if Frappe is available and initialized
   * @returns True if Frappe is ready to use
   */
  isAvailable(): boolean;
}

