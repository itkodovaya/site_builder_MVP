/**
 * Industry Value Object
 * Represents a validated industry category
 */

export type IndustryType = 
  | 'tech'
  | 'finance'
  | 'healthcare'
  | 'retail'
  | 'education'
  | 'real-estate'
  | 'consulting'
  | 'restaurant'
  | 'other';

export class Industry {
  private static readonly VALID_INDUSTRIES: IndustryType[] = [
    'tech',
    'finance',
    'healthcare',
    'retail',
    'education',
    'real-estate',
    'consulting',
    'restaurant',
    'other',
  ];

  private constructor(private readonly value: IndustryType) {
    this.validate(value);
  }

  static create(industry: string): Industry {
    return new Industry(industry as IndustryType);
  }

  static isValid(industry: string): boolean {
    return Industry.VALID_INDUSTRIES.includes(industry as IndustryType);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Industry): boolean {
    return this.value === other.value;
  }

  private validate(value: string): void {
    if (!Industry.isValid(value)) {
      throw new Error(`Invalid industry: ${value}. Must be one of: ${Industry.VALID_INDUSTRIES.join(', ')}`);
    }
  }
}

