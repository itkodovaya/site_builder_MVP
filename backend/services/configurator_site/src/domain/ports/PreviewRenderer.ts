/**
 * PreviewRenderer Port
 * Interface for rendering preview from site configuration
 */

import { SiteConfig } from '../entities/SiteConfig';

export type PreviewFormat = 'html' | 'json';

export interface PreviewModel {
  format: 'json';
  config: ReturnType<SiteConfig['toJSON']>;
  previewUrl?: string;
}

export interface PreviewRenderer {
  /**
   * Render a preview from site configuration
   * Returns HTML string or PreviewModel JSON
   */
  render(config: SiteConfig, format: PreviewFormat): Promise<string | PreviewModel>;
}

