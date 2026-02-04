/**
 * Preview Renderer Service
 * Renders SiteConfig to HTML using EJS templates
 */

import ejs from 'ejs';
import path from 'path';
import fs from 'fs/promises';
import { SiteConfig } from '../../domain/entities/SiteConfig.js';
import { AppError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/utils/logger.js';

export class PreviewRendererService {
  private readonly templateDir: string;
  private readonly cache: Map<string, ejs.TemplateFunction>;

  constructor(templateDir: string) {
    this.templateDir = templateDir;
    this.cache = new Map();
  }

  async render(config: SiteConfig): Promise<string> {
    const templateId = config.theme.templateId || 'default';
    
    try {
      const templateFn = await this.getTemplate(templateId);
      
      const html = templateFn({
        site: config,
        utils: {
          // Helper functions available in template
          getContrastColor: this.getContrastColor
        }
      });

      return html;
    } catch (error) {
      logger.error({ error, templateId }, 'Failed to render preview');
      throw new AppError('Failed to generate preview', 500, 'PREVIEW_GENERATION_FAILED');
    }
  }

  private async getTemplate(templateId: string): Promise<ejs.TemplateFunction> {
    if (this.cache.has(templateId)) {
      return this.cache.get(templateId)!;
    }

    const templatePath = path.join(this.templateDir, `${templateId}.ejs`);
    
    // Check if file exists, fallback to default if not
    let loadPath = templatePath;
    try {
      await fs.access(templatePath);
    } catch {
      logger.warn({ templateId }, 'Template not found, falling back to default');
      loadPath = path.join(this.templateDir, 'default.ejs');
    }

    const templateContent = await fs.readFile(loadPath, 'utf-8');
    const compiled = ejs.compile(templateContent, {
      filename: loadPath,
      async: false
    });

    this.cache.set(templateId, compiled);
    return compiled;
  }

  // Simple utility to determine text color based on bg
  private getContrastColor(hexColor: string): string {
    // Simplified logic
    return '#ffffff';
  }
}
