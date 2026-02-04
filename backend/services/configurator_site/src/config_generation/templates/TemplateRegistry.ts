/**
 * Template Registry
 * Maps industry codes to template IDs
 */

export interface TemplateMapping {
  industryCode: string;
  templateId: string;
  templateVersion: number;
}

const TEMPLATE_MAPPINGS: TemplateMapping[] = [
  { industryCode: 'tech', templateId: 'it_services', templateVersion: 1 },
  { industryCode: 'finance', templateId: 'finance_professional', templateVersion: 1 },
  { industryCode: 'healthcare', templateId: 'healthcare_trust', templateVersion: 1 },
  { industryCode: 'retail', templateId: 'retail_vibrant', templateVersion: 1 },
  { industryCode: 'education', templateId: 'education_inspire', templateVersion: 1 },
  { industryCode: 'real-estate', templateId: 'realestate_premium', templateVersion: 1 },
  { industryCode: 'consulting', templateId: 'consulting_professional', templateVersion: 1 },
  { industryCode: 'restaurant', templateId: 'restaurant_delicious', templateVersion: 1 },
  { industryCode: 'other', templateId: 'default', templateVersion: 1 },
];

const DEFAULT_TEMPLATE: TemplateMapping = {
  industryCode: 'other',
  templateId: 'default',
  templateVersion: 1,
};

export class TemplateRegistry {
  /**
   * Get template by industry code
   * Falls back to default template if industry not found
   */
  static getByIndustry(industryCode: string): TemplateMapping {
    const mapping = TEMPLATE_MAPPINGS.find(m => m.industryCode === industryCode);
    return mapping || DEFAULT_TEMPLATE;
  }

  /**
   * Get all registered templates
   */
  static getAllTemplates(): TemplateMapping[] {
    return [...TEMPLATE_MAPPINGS];
  }

  /**
   * Check if industry has a specific template
   */
  static hasTemplate(industryCode: string): boolean {
    return TEMPLATE_MAPPINGS.some(m => m.industryCode === industryCode);
  }
}

