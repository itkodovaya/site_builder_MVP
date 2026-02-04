/**
 * Site Config Generator Implementation
 * Template-based generation following the algorithm:
 * 1. Normalize & validate
 * 2. Select template
 * 3. Build BrandProfile
 * 4. Generate theme defaults
 * 5. Generate pages + sections (tokenized)
 * 6. Add publishable metadata
 * 7. Output SiteConfig JSON
 */

import { v4 as uuidv4 } from 'uuid';
import { SiteConfigGenerator } from '../domain/ports/SiteConfigGenerator';
import { SiteDraft } from '../domain/entities/SiteDraft';
import { SiteConfig } from '../domain/entities/SiteConfig';
import { TemplateRegistry } from './templates/TemplateRegistry';
import { TemplateLoader } from './templates/TemplateLoader';
import { resolveTokens, resolveSectionProps } from './templates/TemplateDefinition';
import { generateSlug } from '../lib/slug';
import { FrappeAdapter } from '../domain/ports/FrappeAdapter';

export class SiteConfigGeneratorImpl implements SiteConfigGenerator {
  constructor(
    private readonly frappeAdapter?: FrappeAdapter
  ) {}
  async generate(draft: SiteDraft): Promise<SiteConfig> {
    const brandProfile = draft.brandProfile;
    const generator = draft.generator;

    // Step 1: Normalize & validate inputs
    const brandName = this.normalizeBrandName(brandProfile.getBrandName().toString());
    const industryCode = brandProfile.getIndustry().getCode();
    const industryLabel = brandProfile.getIndustry().getLabel();
    const logo = brandProfile.getLogo();

    // Step 2: Select template via registry
    const templateMapping = TemplateRegistry.getByIndustry(industryCode);
    const template = TemplateLoader.load(templateMapping.templateId);

    // Step 3: Build BrandProfile block
    const slug = generateSlug(brandName);
    const brand = {
      name: brandName,
      industry: {
        code: industryCode,
        label: industryLabel,
      },
      slug,
      logo: logo ? {
        assetId: logo.getAssetId(),
        url: logo.getUrl(),
      } : undefined,
    };

    // Token context for template resolution
    const tokenContext = {
      brandName,
      industryLabel,
      logoUrl: logo?.getUrl(),
      slug,
    };

    // Step 4: Generate theme defaults (template-driven)
    const theme = {
      themeId: `${template.templateId}_default`,
      ...template.defaults.theme,
    };

    // Step 5: Generate pages + sections with token resolution
    const pages = template.pages.map(pageTemplate => ({
      id: pageTemplate.id,
      path: pageTemplate.path,
      title: resolveTokens(pageTemplate.titleTemplate, tokenContext),
      sections: pageTemplate.sections.map(sectionTemplate => {
        // Resolve special tokens in props
        let resolvedProps = resolveSectionProps(sectionTemplate.props, tokenContext);
        
        // Handle logoAssetId token specially
        if (resolvedProps.logoAssetId === '{{logoAssetId}}') {
          resolvedProps.logoAssetId = logo?.getAssetId() || null;
        }
        
        return {
          id: sectionTemplate.id,
          type: sectionTemplate.type,
          props: resolvedProps,
        };
      }),
    }));

    // Step 6: Add publishable metadata
    const site = {
      language: generator.getLocale(),
      title: `${brandName} — ${template.defaults.seo.titleSuffix}`,
      description: resolveTokens(template.defaults.seo.descriptionTemplate, tokenContext),
      routing: {
        basePath: '/',
        trailingSlash: false,
      },
      seo: {
        title: `${brandName} — ${template.defaults.seo.titleSuffix}`,
        description: resolveTokens(template.defaults.seo.descriptionTemplate, tokenContext),
        ogImageAssetId: logo?.getAssetId() || null,
      },
    };

    // Build assets array
    const assets = logo ? [{
      assetId: logo.getAssetId(),
      type: 'logo',
      mimeType: logo.getMimeType(),
      url: logo.getUrl(),
      bytes: logo.getBytes(),
      sha256: logo.getSha256(),
    }] : [];

    // Publishing configuration
    const publishing = {
      target: 'static' as const,
      output: {
        format: 'html' as const,
        entryPageId: 'home',
      },
      constraints: {
        maxPages: 10,
        maxSectionsPerPage: 30,
      },
    };

    // Step 7: Output SiteConfig JSON (publish-ready)
    return SiteConfig.create({
      schemaVersion: 1,
      configVersion: '1.0.0',
      configId: this.generateConfigId(),
      draftId: draft.draftId.toString(),
      generatedAt: new Date(),
      generator: {
        engine: generator.getEngine(),
        engineVersion: generator.getEngineVersion(),
        templateId: template.templateId,
        templateVersion: template.templateVersion,
      },
      brand,
      site,
      theme,
      pages,
      assets,
      publishing,
    });
  }

  /**
   * Step 1: Normalize brand name
   * Trim, remove control characters, enforce length limits
   */
  private normalizeBrandName(brandName: string): string {
    return brandName
      .trim()
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Enforce max length (already validated in domain, but be safe)
      .substring(0, 100);
  }

  /**
   * Generate unique config ID
   * Format: cfg_{ulid}
   */
  private generateConfigId(): string {
    // Using UUID for now, could be ULID for sortable IDs
    const id = uuidv4().replace(/-/g, '').toUpperCase();
    return `cfg_${id.substring(0, 26)}`;
  }
}
