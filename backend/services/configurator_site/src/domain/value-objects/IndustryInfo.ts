/**
 * IndustryInfo Value Object
 * Represents industry with code and label
 */

export interface IndustryInfoProps {
  code: string;
  label: string;
}

const INDUSTRY_MAP: Record<string, string> = {
  'tech': 'Технологии',
  'finance': 'Финансы',
  'healthcare': 'Здравоохранение',
  'retail': 'Розничная торговля',
  'education': 'Образование',
  'real-estate': 'Недвижимость',
  'consulting': 'Консалтинг',
  'restaurant': 'Ресторан',
  'other': 'Другое',
};

export class IndustryInfo {
  private constructor(
    private readonly code: string,
    private readonly label: string
  ) {
    this.validate();
  }

  static create(code: string, label?: string): IndustryInfo {
    const resolvedLabel = label || INDUSTRY_MAP[code] || code;
    return new IndustryInfo(code, resolvedLabel);
  }

  static fromJSON(props: IndustryInfoProps): IndustryInfo {
    return new IndustryInfo(props.code, props.label);
  }

  getCode(): string {
    return this.code;
  }

  getLabel(): string {
    return this.label;
  }

  toJSON(): IndustryInfoProps {
    return {
      code: this.code,
      label: this.label,
    };
  }

  private validate(): void {
    if (!this.code) {
      throw new Error('Industry code is required');
    }
  }
}

