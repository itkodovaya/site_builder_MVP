/**
 * Frappe Integration Tests
 * 
 * These tests verify the complete integration of Frappe with the configurator service.
 * They require Frappe library to be available in the configured path.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { DIContainer } from '../../src/container/DIContainer';
import { SiteDraft } from '../../src/domain/entities/SiteDraft';
import { BrandProfile } from '../../src/domain/entities/BrandProfile';
import { IndustryInfo } from '../../src/domain/value-objects/IndustryInfo';
import { DraftId } from '../../src/domain/value-objects/DraftId';

describe('Frappe Integration', () => {
  let container: DIContainer;

  beforeAll(() => {
    container = new DIContainer();
  });

  describe('FrappeAdapter in DIContainer', () => {
    it('should handle Frappe unavailability gracefully', () => {
      const frappeAdapter = container.getFrappeAdapter();

      // Frappe will be unavailable in test environment without library
      // This should not crash the system
      if (frappeAdapter) {
        expect(frappeAdapter.isAvailable()).toBeDefined();
      } else {
        // Null is acceptable - fallback renderer will be used
        expect(frappeAdapter).toBeNull();
      }
    });

    it('should create preview renderer with or without Frappe', () => {
      const previewRenderer = container.getPreviewRenderer();

      expect(previewRenderer).toBeDefined();
      // Renderer should work even if Frappe is unavailable
    });

    it('should create config generator with or without Frappe', () => {
      const configGenerator = container.getConfigGenerator();

      expect(configGenerator).toBeDefined();
      // Generator should work even if Frappe is unavailable
    });
  });

  describe('Preview rendering with Frappe fallback', () => {
    it('should generate preview using fallback when Frappe is unavailable', async () => {
      const previewRenderer = container.getPreviewRenderer();
      const configGenerator = container.getConfigGenerator();

      // Create mock draft
      const mockDraft = createMockDraft();

      // Generate config
      const config = await configGenerator.generate(mockDraft);

      // Render preview
      const preview = await previewRenderer.render(config, 'html');

      expect(preview).toBeDefined();
      expect(preview.type).toBe('html');
      expect(preview.content).toBeDefined();
      expect(preview.content.length).toBeGreaterThan(0);
    });
  });
});

function createMockDraft(): SiteDraft {
  const brandProfile = new BrandProfile(
    1,
    'Test Corp',
    new IndustryInfo('tech', 'Technology'),
    undefined
  );

  return {
    schemaVersion: 1,
    draftId: DraftId.generate(),
    status: 'DRAFT',
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    ttlSeconds: 86400,
    brandProfile,
    generator: {
      engine: 'configurator_site',
      engineVersion: '0.1.0',
      templateId: 'default',
      locale: 'ru-RU',
      toJSON: () => ({}),
    },
    preview: {
      mode: 'html',
      url: null,
      lastGeneratedAt: null,
      etag: null,
      toJSON: () => ({}),
    },
    meta: {
      ipHash: null,
      userAgentHash: null,
      source: 'web',
      notes: null,
      toJSON: () => ({}),
    },
    isExpired: () => false,
    update: () => ({} as any),
    updatePreview: () => ({} as any),
    toJSON: () => ({}),
    getBrandProfile: () => brandProfile,
    getGenerator: () => ({
      engine: 'configurator_site',
      engineVersion: '0.1.0',
      templateId: 'default',
      locale: 'ru-RU',
    }),
  } as any;
}

