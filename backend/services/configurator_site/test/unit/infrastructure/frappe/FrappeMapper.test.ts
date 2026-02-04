/**
 * FrappeMapper Unit Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { FrappeMapper } from '../../../../src/infrastructure/frappe/FrappeMapper';
import { SiteConfig } from '../../../../src/domain/entities/SiteConfig';

describe('FrappeMapper', () => {
  let mapper: FrappeMapper;

  beforeEach(() => {
    mapper = new FrappeMapper();
  });

  describe('mapToFrappe', () => {
    it('should map SiteConfig to Frappe format', () => {
      // Create mock SiteConfig
      const mockConfig = {
        toJSON: () => ({
          schemaVersion: 1,
          configId: 'cfg_123',
          brand: {
            name: 'TechCorp',
            slug: 'techcorp',
            logo: {
              url: 'https://example.com/logo.png',
              width: 100,
              height: 100,
            },
          },
          theme: {
            palette: {
              primary: '#025add',
              accent: '#4820a7',
              background: '#ffffff',
              text: '#111111',
            },
            typography: {
              fontFamily: 'Inter, sans-serif',
            },
            radius: 'md',
            spacing: 'md',
          },
          pages: [
            {
              id: 'home',
              path: '/',
              title: 'Home',
              sections: [
                {
                  id: 'hero_1',
                  type: 'hero',
                  props: {
                    headline: 'Welcome',
                    subheadline: 'To our site',
                  },
                },
              ],
            },
          ],
          assets: [],
        }),
      } as SiteConfig;

      const frappeConfig = mapper.mapToFrappe(mockConfig);

      expect(frappeConfig).toBeDefined();
      expect(frappeConfig.brand.name).toBe('TechCorp');
      expect(frappeConfig.theme.colors.primary).toBe('#025add');
      expect(frappeConfig.pages).toHaveLength(1);
      expect(frappeConfig.pages[0].id).toBe('home');
    });

    it('should map hero section props correctly', () => {
      const mockConfig = {
        toJSON: () => ({
          pages: [
            {
              id: 'home',
              path: '/',
              title: 'Home',
              sections: [
                {
                  id: 'hero_1',
                  type: 'hero',
                  props: {
                    headline: 'Welcome',
                    subheadline: 'Description',
                    primaryCta: {
                      text: 'Get Started',
                      href: '/signup',
                    },
                  },
                },
              ],
            },
          ],
          brand: { name: 'Test' },
          theme: { palette: {} },
          assets: [],
        }),
      } as SiteConfig;

      const frappeConfig = mapper.mapToFrappe(mockConfig);
      const heroSection = frappeConfig.pages[0].sections[0];

      expect(heroSection.props.heading).toBe('Welcome');
      expect(heroSection.props.subheading).toBe('Description');
      expect(heroSection.props.primaryButton).toEqual({
        text: 'Get Started',
        href: '/signup',
      });
    });

    it('should handle missing logo gracefully', () => {
      const mockConfig = {
        toJSON: () => ({
          brand: { name: 'Test', logo: undefined },
          theme: { palette: {} },
          pages: [],
          assets: [],
        }),
      } as SiteConfig;

      const frappeConfig = mapper.mapToFrappe(mockConfig);

      expect(frappeConfig.brand.logo).toBeUndefined();
    });
  });

  describe('mapFromFrappe', () => {
    it('should reverse map Frappe config to domain model', () => {
      const frappeConfig = {
        pages: [
          {
            id: 'home',
            path: '/',
            title: 'Home',
            sections: [
              {
                id: 'hero_1',
                type: 'hero',
                props: { heading: 'Welcome' },
              },
            ],
          },
        ],
        theme: {
          colors: {
            primary: '#025add',
            accent: '#4820a7',
            background: '#ffffff',
            text: '#111111',
          },
          fonts: { body: 'Inter' },
        },
        brand: {
          name: 'TechCorp',
          logo: { url: 'https://example.com/logo.png' },
        },
      };

      const domainModel = mapper.mapFromFrappe(frappeConfig);

      expect(domainModel.brand.name).toBe('TechCorp');
      expect(domainModel.theme.palette.primary).toBe('#025add');
      expect(domainModel.pages).toHaveLength(1);
    });
  });
});

