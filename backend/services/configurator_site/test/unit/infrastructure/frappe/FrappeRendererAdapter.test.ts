/**
 * FrappeRendererAdapter Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FrappeRendererAdapter } from '../../../../src/infrastructure/frappe/FrappeRendererAdapter';
import { SiteConfig } from '../../../../src/domain/entities/SiteConfig';
import { FrappeConfig } from '../../../../src/config/frappe';

describe('FrappeRendererAdapter', () => {
  let adapter: FrappeRendererAdapter;
  let mockConfig: FrappeConfig;

  beforeEach(() => {
    mockConfig = {
      enabled: true,
      libraryPath: './mock/frappe',
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
  });

  describe('isAvailable', () => {
    it('should return false when disabled in config', () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      adapter = new FrappeRendererAdapter(disabledConfig);

      expect(adapter.isAvailable()).toBe(false);
    });

    it('should handle initialization failure gracefully', () => {
      adapter = new FrappeRendererAdapter(mockConfig);

      // Frappe initialization will fail because library doesn't exist
      // Adapter should report unavailable
      expect(adapter.isAvailable()).toBe(false);
      expect(adapter.getInitializationError()).toBeDefined();
    });
  });

  describe('renderHtml', () => {
    it('should throw error when Frappe is not available', async () => {
      adapter = new FrappeRendererAdapter({ ...mockConfig, enabled: false });

      const mockSiteConfig = {
        toJSON: () => ({ brand: { name: 'Test' } }),
      } as SiteConfig;

      await expect(adapter.renderHtml(mockSiteConfig)).rejects.toThrow(
        'Frappe is not available'
      );
    });
  });

  describe('getConfig', () => {
    it('should return the configuration', () => {
      adapter = new FrappeRendererAdapter(mockConfig);

      const config = adapter.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.renderOptions.ssr).toBe(true);
    });
  });
});

