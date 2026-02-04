/**
 * Validation error
 */

import { AppError } from './AppError.js';

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

export class InvalidIndustryError extends AppError {
  constructor(category: string, subcategory?: string) {
    super(
      subcategory
        ? `Invalid subcategory '${subcategory}' for category '${category}'`
        : `Invalid industry category '${category}'`,
      422,
      'INVALID_INDUSTRY',
      { category, subcategory }
    );
  }
}

export class InvalidFileTypeError extends AppError {
  constructor(mimeType: string, allowedTypes: string[]) {
    super(
      `File type '${mimeType}' not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      415,
      'UNSUPPORTED_FILE_TYPE',
      { mimeType, allowedTypes }
    );
  }
}

export class FileTooLargeError extends AppError {
  constructor(size: number, maxSize: number) {
    super(
      `File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${maxSize}MB`,
      413,
      'ASSET_TOO_LARGE',
      { sizeBytes: size, maxSizeBytes: maxSize * 1024 * 1024 }
    );
  }
}

export class DraftExpiredError extends AppError {
  constructor(draftId: string) {
    super(
      `Draft '${draftId}' has expired`,
      410,
      'DRAFT_EXPIRED',
      { draftId }
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Missing or invalid authentication') {
    super(message, 401, 'UNAUTHORIZED');
  }
}
