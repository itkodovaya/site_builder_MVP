/**
 * FrappeRendererAdapter
 * Adapter implementation that wraps Frappe library
 * 
 * This adapter provides the concrete implementation of FrappeAdapter port,
 * enabling the use of Frappe Builder for rendering and page generation
 * while keeping the domain layer independent of Frappe specifics.
 */

import {
  FrappeAdapter,
  TokenContext,
  TemplateDefinition,
  PageStructure,
  ValidationResult,
} from '../../domain/ports/FrappeAdapter';
import { SiteConfig } from '../../domain/entities/SiteConfig';
import { FrappeMapper } from './FrappeMapper';
import {
  FrappeInstance,
  FrappeInitConfig,
  FrappeRenderOptions,
} from './FrappeTypes';
import { FrappeConfig as AdapterFrappeConfig } from '../../config/frappe';

export class FrappeRendererAdapter implements FrappeAdapter {
  private frappe: FrappeInstance | null = null;
  private mapper: FrappeMapper;
  private isInitialized: boolean = false;
  private initializationError: Error | null = null;

  constructor(private readonly config: AdapterFrappeConfig) {
    this.mapper = new FrappeMapper();
    
    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize Frappe library
   */
  private async initialize(): Promise<void> {
    try {
      // Import Frappe library dynamically
      // Note: The actual import path depends on how builder-develop.zip is structured
      // This is a placeholder that should be updated based on actual Frappe exports
      
      const frappeModule = await this.loadFrappeModule();
      
      if (!frappeModule) {
        throw new Error('Frappe module not found. Ensure builder-develop.zip is extracted to lib/');
      }

      const initConfig: FrappeInitConfig = {
        libraryPath: this.config.libraryPath,
        ssr: this.config.renderOptions.ssr,
        cache: {
          enabled: this.config.cache.enabled,
          ttl: this.config.cache.ttl,
        },
      };

      this.frappe = await frappeModule.initialize(initConfig);
      this.isInitialized = true;
      
      console.log('[FrappeAdapter] Frappe initialized successfully');
    } catch (error) {
      this.initializationError = error as Error;
      console.error('[FrappeAdapter] Failed to initialize Frappe:', error);
      this.isInitialized = false;
      this.frappe = null;
    }
  }

  /**
   * Load Frappe module dynamically
   * This method attempts to load Frappe from the configured library path
   */
  private async loadFrappeModule(): Promise<any> {
    try {
      // Attempt to load from configured path
      // The actual module structure depends on builder-develop.zip contents
      
      // Option 1: Direct import (if Frappe provides a main entry point)
      const frappeLib = await import(this.config.libraryPath);
      return frappeLib;
    } catch (error) {
      console.warn('[FrappeAdapter] Failed to load Frappe from configured path:', error);
      
      // Option 2: Try alternative paths
      try {
        const frappeLib = await import(`${this.config.libraryPath}/index.js`);
        return frappeLib;
      } catch (altError) {
        console.error('[FrappeAdapter] Failed to load Frappe from alternative path:', altError);
        return null;
      }
    }
  }

  /**
   * Render HTML from SiteConfig using Frappe SSR
   */
  async renderHtml(config: SiteConfig): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error(
        'Frappe is not available. ' +
        (this.initializationError 
          ? `Initialization error: ${this.initializationError.message}` 
          : 'Frappe is disabled in configuration')
      );
    }

    try {
      // Map domain model to Frappe format
      const frappeConfig = this.mapper.mapToFrappe(config);

      // Prepare render options
      const renderOptions: FrappeRenderOptions = {
        ssr: this.config.renderOptions.ssr,
        minify: this.config.renderOptions.minify,
        inline: this.config.renderOptions.inline,
        lang: this.config.renderOptions.lang,
      };

      // Call Frappe render
      const html = await this.frappe!.render(frappeConfig, renderOptions);

      return html;
    } catch (error) {
      console.error('[FrappeAdapter] Rendering failed:', error);
      throw new Error(`Frappe rendering failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate page structure from template using Frappe page builder
   */
  async generatePageStructure(
    template: TemplateDefinition,
    tokens: TokenContext
  ): Promise<PageStructure> {
    if (!this.isAvailable()) {
      throw new Error('Frappe is not available');
    }

    try {
      // Use Frappe's page builder to generate structure
      const pages = await this.frappe!.buildPages(template, tokens);

      return {
        pages: pages.map(page => ({
          id: page.id,
          path: page.path,
          title: page.title,
          sections: page.sections.map(section => ({
            id: section.id,
            type: section.type,
            props: section.props,
          })),
        })),
      };
    } catch (error) {
      console.error('[FrappeAdapter] Page structure generation failed:', error);
      throw new Error(`Frappe page generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validate configuration through Frappe
   */
  async validateConfig(config: SiteConfig): Promise<ValidationResult> {
    if (!this.isAvailable()) {
      // If Frappe is not available, return valid by default
      return { valid: true };
    }

    if (!this.config.security.validateConfig) {
      // Validation disabled in config
      return { valid: true };
    }

    try {
      const frappeConfig = this.mapper.mapToFrappe(config);
      const result = this.frappe!.validate(frappeConfig);

      return {
        valid: result.valid,
        errors: result.errors?.map(err => ({
          field: err.field,
          message: err.message,
          code: 'FRAPPE_VALIDATION_ERROR',
        })),
      };
    } catch (error) {
      console.error('[FrappeAdapter] Validation failed:', error);
      return {
        valid: false,
        errors: [{
          field: 'config',
          message: `Validation error: ${(error as Error).message}`,
          code: 'VALIDATION_EXCEPTION',
        }],
      };
    }
  }

  /**
   * Check if Frappe is available and initialized
   */
  isAvailable(): boolean {
    return this.config.enabled && this.isInitialized && this.frappe !== null;
  }

  /**
   * Get initialization error if any
   */
  getInitializationError(): Error | null {
    return this.initializationError;
  }

  /**
   * Get Frappe configuration
   */
  getConfig(): AdapterFrappeConfig {
    return this.config;
  }
}

