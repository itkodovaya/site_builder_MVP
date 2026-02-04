/**
 * TypeScript types for Frappe Builder
 * These types represent the Frappe library's API and data structures
 */

/**
 * Frappe configuration format
 */
export interface FrappeConfig {
  pages: FrappePage[];
  theme: FrappeTheme;
  brand: FrappeBrand;
  assets?: FrappeAsset[];
}

/**
 * Frappe page structure
 */
export interface FrappePage {
  id: string;
  path: string;
  title: string;
  sections: FrappeSection[];
  meta?: {
    description?: string;
    keywords?: string[];
  };
}

/**
 * Frappe section structure
 */
export interface FrappeSection {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: FrappeSection[];
}

/**
 * Frappe theme configuration
 */
export interface FrappeTheme {
  colors: {
    primary: string;
    secondary?: string;
    accent: string;
    background: string;
    text: string;
    muted?: string;
  };
  fonts: {
    heading?: string;
    body: string;
  };
  spacing?: {
    unit: number;
    scale: 'compact' | 'normal' | 'relaxed';
  };
  borderRadius?: {
    small: string;
    medium: string;
    large: string;
  };
}

/**
 * Frappe brand information
 */
export interface FrappeBrand {
  name: string;
  logo?: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  tagline?: string;
}

/**
 * Frappe asset reference
 */
export interface FrappeAsset {
  id: string;
  url: string;
  type: 'image' | 'video' | 'icon';
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    size?: number;
  };
}

/**
 * Frappe render options
 */
export interface FrappeRenderOptions {
  ssr?: boolean;
  minify?: boolean;
  inline?: boolean;
  lang?: string;
}

/**
 * Frappe instance interface (assumed from library)
 * This represents the main Frappe API
 */
export interface FrappeInstance {
  /**
   * Render configuration to HTML
   */
  render(config: FrappeConfig, options?: FrappeRenderOptions): Promise<string>;

  /**
   * Generate page structure from template
   */
  buildPages(template: any, context: any): Promise<FrappePage[]>;

  /**
   * Validate configuration
   */
  validate(config: FrappeConfig): {
    valid: boolean;
    errors?: Array<{ field: string; message: string }>;
  };

  /**
   * Check if Frappe is initialized
   */
  isReady(): boolean;
}

/**
 * Frappe initialization config
 */
export interface FrappeInitConfig {
  libraryPath?: string;
  ssr?: boolean;
  plugins?: any[];
  cache?: {
    enabled: boolean;
    ttl?: number;
  };
}

