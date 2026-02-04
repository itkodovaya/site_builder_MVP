/**
 * ConfigVersion Value Object
 * Represents a configuration schema version for forward compatibility
 */

export class ConfigVersion {
  private static readonly CURRENT_VERSION = '1.0';

  private constructor(private readonly value: string) {
    this.validate(value);
  }

  static current(): ConfigVersion {
    return new ConfigVersion(ConfigVersion.CURRENT_VERSION);
  }

  static fromString(version: string): ConfigVersion {
    return new ConfigVersion(version);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ConfigVersion): boolean {
    return this.value === other.value;
  }

  private validate(value: string): void {
    // Semantic version format: X.Y or X.Y.Z
    const versionRegex = /^\d+\.\d+(\.\d+)?$/;
    if (!versionRegex.test(value)) {
      throw new Error(`Invalid config version: ${value}`);
    }
  }
}

