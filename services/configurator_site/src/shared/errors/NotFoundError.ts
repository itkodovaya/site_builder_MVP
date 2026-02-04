/**
 * Not found error
 */

import { AppError } from './AppError.js';

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class DraftNotFoundError extends AppError {
  constructor(draftId: string) {
    super(
      `Draft with ID '${draftId}' not found or expired`,
      404,
      'DRAFT_NOT_FOUND',
      { draftId }
    );
  }
}

export class AssetNotFoundError extends AppError {
  constructor(assetId: string) {
    super(
      `Asset with ID '${assetId}' not found or expired`,
      404,
      'ASSET_NOT_FOUND',
      { assetId }
    );
  }
}
