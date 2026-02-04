/**
 * Template Definition
 * Defines structure and defaults for each template
 */

import { ThemeConfig, SectionProps } from '../../domain/entities/SiteConfig';

export interface TemplateDefaults {
  theme: Omit<ThemeConfig, 'themeId'>;
  seo: {
    titleSuffix: string;
    descriptionTemplate: string;
  };
}

export interface SectionTemplate {
  id: string;
  type: string;
  props: Record<string, any>; // Contains tokens like {{brandName}}
}

export interface PageTemplate {
  id: string;
  path: string;
  titleTemplate: string;
  sections: SectionTemplate[];
}

export interface TemplateDefinition {
  templateId: string;
  templateVersion: number;
  name: string;
  description: string;
  defaults: TemplateDefaults;
  pages: PageTemplate[];
}

/**
 * Token replacement in template strings
 * Replaces {{brandName}}, {{industryLabel}}, etc.
 */
export function resolveTokens(
  template: string,
  context: {
    brandName: string;
    industryLabel: string;
    logoUrl?: string;
    slug: string;
  }
): string {
  return template
    .replace(/\{\{brandName\}\}/g, context.brandName)
    .replace(/\{\{industryLabel\}\}/g, context.industryLabel)
    .replace(/\{\{logoUrl\}\}/g, context.logoUrl || '')
    .replace(/\{\{slug\}\}/g, context.slug);
}

/**
 * Resolve tokens in section props (recursive)
 */
export function resolveSectionProps(
  props: Record<string, any>,
  context: {
    brandName: string;
    industryLabel: string;
    logoUrl?: string;
    slug: string;
  }
): Record<string, any> {
  const resolved: Record<string, any> = {};

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string') {
      resolved[key] = resolveTokens(value, context);
    } else if (Array.isArray(value)) {
      resolved[key] = value.map(item =>
        typeof item === 'object' ? resolveSectionProps(item, context) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      resolved[key] = resolveSectionProps(value, context);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

