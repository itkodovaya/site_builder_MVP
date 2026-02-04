/**
 * DraftId Value Object
 * Represents a unique identifier for a draft
 */

import { v4 as uuidv4 } from 'uuid';

export class DraftId {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Invalid DraftId: ${value}`);
    }
  }

  static create(): DraftId {
    return new DraftId(uuidv4());
  }

  static generate(): DraftId {
    return new DraftId(uuidv4());
  }

  static fromString(id: string): DraftId {
    return new DraftId(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: DraftId): boolean {
    return this.value === other.value;
  }

  private isValid(value: string): boolean {
    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}

