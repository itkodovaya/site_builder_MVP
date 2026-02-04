/**
 * Frappe Configuration
 * Configuration settings for Frappe integration
 */

import { z } from 'zod';

/**
 * Frappe configuration schema
 */
export const FrappeConfigSchema = z.object({
  enabled: z.boolean().default(false),
  libraryPath: z.string().default('./src/infrastructure/frappe/lib'),
  
  renderOptions: z.object({
    ssr: z.boolean().default(true),
    minify: z.boolean().default(false),
    inline: z.boolean().default(false),
    lang: z.string().default('ru-RU'),
  }).default({}),
  
  builderOptions: z.object({
    enableDragDrop: z.boolean().default(false),
    enablePreview: z.boolean().default(true),
    enableTemplates: z.boolean().default(true),
  }).default({}),
  
  cache: z.object({
    enabled: z.boolean().default(true),
    ttl: z.number().default(3600), // 1 hour
  }).default({}),
  
  security: z.object({
    sanitizeOutput: z.boolean().default(true),
    validateConfig: z.boolean().default(true),
    allowedSectionTypes: z.array(z.string()).optional(),
  }).default({}),
});

export type FrappeConfig = z.infer<typeof FrappeConfigSchema>;

/**
 * Load Frappe configuration from environment
 */
export function loadFrappeConfig(): FrappeConfig {
  return FrappeConfigSchema.parse({
    enabled: process.env.ENABLE_FRAPPE === 'true',
    libraryPath: process.env.FRAPPE_LIBRARY_PATH,
    
    renderOptions: {
      ssr: process.env.FRAPPE_SSR_ENABLED !== 'false',
      minify: process.env.FRAPPE_MINIFY_HTML === 'true',
      inline: process.env.FRAPPE_INLINE_ASSETS === 'true',
      lang: process.env.FRAPPE_LANG || 'ru-RU',
    },
    
    builderOptions: {
      enableDragDrop: process.env.FRAPPE_ENABLE_DRAG_DROP === 'true',
      enablePreview: process.env.FRAPPE_ENABLE_PREVIEW !== 'false',
      enableTemplates: process.env.FRAPPE_ENABLE_TEMPLATES !== 'false',
    },
    
    cache: {
      enabled: process.env.FRAPPE_CACHE_ENABLED !== 'false',
      ttl: parseInt(process.env.FRAPPE_CACHE_TTL || '3600', 10),
    },
    
    security: {
      sanitizeOutput: process.env.FRAPPE_SANITIZE_OUTPUT !== 'false',
      validateConfig: process.env.FRAPPE_VALIDATE_CONFIG !== 'false',
    },
  });
}

/**
 * Default Frappe configuration
 */
export const DEFAULT_FRAPPE_CONFIG: FrappeConfig = {
  enabled: false,
  libraryPath: './src/infrastructure/frappe/lib',
  renderOptions: {
    ssr: true,
    minify: false,
    inline: false,
    lang: 'ru-RU',
  },
  builderOptions: {
    enableDragDrop: false,
    enablePreview: true,
    enableTemplates: true,
  },
  cache: {
    enabled: true,
    ttl: 3600,
  },
  security: {
    sanitizeOutput: true,
    validateConfig: true,
  },
};

