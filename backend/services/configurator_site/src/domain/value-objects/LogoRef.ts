/**
 * LogoRef Value Object
 * Represents a reference to a logo asset in storage
 */

export class LogoRef {
  private constructor(private readonly value: string) {
    this.validate(value);
  }

  static create(ref: string): LogoRef {
    return new LogoRef(ref);
  }

  static createEmpty(): LogoRef | null {
    return null;
  }

  toString(): string {
    return this.value;
  }

  equals(other: LogoRef): boolean {
    return this.value === other.value;
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('LogoRef cannot be empty');
    }
    // Basic path validation - should be a storage key/path
    if (value.includes('..') || value.startsWith('/')) {
      throw new Error('Invalid LogoRef path');
    }
  }
}

