/**
 * Template Loader
 * Loads template definitions by ID
 */

import { TemplateDefinition } from './TemplateDefinition';
import { ITServicesTemplate } from './definitions/ITServicesTemplate';
import { DefaultTemplate } from './definitions/DefaultTemplate';

const TEMPLATES: Record<string, TemplateDefinition> = {
  'it_services': ITServicesTemplate,
  'default': DefaultTemplate,
  // Add more templates here as needed
  // 'finance_professional': FinanceTemplate,
  // 'healthcare_trust': HealthcareTemplate,
  // etc.
};

export class TemplateLoader {
  /**
   * Load template definition by ID
   * Falls back to default if not found
   */
  static load(templateId: string): TemplateDefinition {
    const template = TEMPLATES[templateId];
    
    if (!template) {
      console.warn(`Template ${templateId} not found, using default`);
      return TEMPLATES['default'];
    }
    
    return template;
  }

  /**
   * Check if template exists
   */
  static exists(templateId: string): boolean {
    return templateId in TEMPLATES;
  }

  /**
   * Get all available templates
   */
  static getAllTemplates(): TemplateDefinition[] {
    return Object.values(TEMPLATES);
  }
}

