/**
 * Preview Renderer Implementation
 * Renders preview from SiteConfig in HTML or JSON format
 */

import { PreviewRenderer, PreviewFormat, PreviewModel } from '../domain/ports/PreviewRenderer';
import { SiteConfig } from '../domain/entities/SiteConfig';
import { HtmlTemplateRenderer } from './renderers/HtmlTemplateRenderer';

export class PreviewRendererImpl implements PreviewRenderer {
  constructor(
    private readonly htmlRenderer: HtmlTemplateRenderer,
    private readonly basePreviewUrl?: string
  ) {}

  async render(config: SiteConfig, format: PreviewFormat): Promise<string | PreviewModel> {
    if (format === 'json') {
      return this.renderJson(config);
    }
    
    return this.renderHtml(config);
  }

  private async renderHtml(config: SiteConfig): Promise<string> {
    return this.htmlRenderer.render(config);
  }

  private renderJson(config: SiteConfig): PreviewModel {
    const configJson = config.toJSON();
    
    return {
      format: 'json',
      config: configJson,
      previewUrl: this.basePreviewUrl 
        ? `${this.basePreviewUrl}?config=${encodeURIComponent(JSON.stringify(configJson))}`
        : undefined,
    };
  }
}

