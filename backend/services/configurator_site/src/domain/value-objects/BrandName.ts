/**
 * BrandName Value Object
 * Represents a validated brand name
 */

export class BrandName {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 100;

  private constructor(private readonly value: string) {
    this.validate(value);
  }

  static create(name: string): BrandName {
    return new BrandName(name.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: BrandName): boolean {
    return this.value === other.value;
  }

  private validate(value: string): void {
    if (value.length < BrandName.MIN_LENGTH) {
      throw new Error('Brand name cannot be empty');
    }
    if (value.length > BrandName.MAX_LENGTH) {
      throw new Error(`Brand name cannot exceed ${BrandName.MAX_LENGTH} characters`);
    }
  }
}

