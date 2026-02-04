/**
 * Domain Errors
 * Business-level errors that represent domain rule violations
 */

export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DraftNotFoundError extends DomainError {
  constructor(draftId: string) {
    super(`Draft with id ${draftId} not found`, 'DRAFT_NOT_FOUND');
  }
}

export class DraftExpiredError extends DomainError {
  constructor(draftId: string) {
    super(`Draft with id ${draftId} has expired`, 'DRAFT_EXPIRED');
  }
}

export class InvalidDraftDataError extends DomainError {
  constructor(message: string, public readonly details?: unknown) {
    super(message, 'INVALID_DRAFT_DATA');
  }
}

export class ConfigGenerationError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFIG_GENERATION_ERROR');
  }
}

export class PreviewRenderError extends DomainError {
  constructor(message: string) {
    super(message, 'PREVIEW_RENDER_ERROR');
  }
}

export class AssetNotFoundError extends DomainError {
  constructor(assetId: string) {
    super(`Asset with id ${assetId} not found`, 'ASSET_NOT_FOUND');
  }
}

export class DraftAlreadyCommittedError extends DomainError {
  constructor(draftId: string, projectId: string) {
    super(
      `Draft ${draftId} has already been committed to project ${projectId}`,
      'DRAFT_ALREADY_COMMITTED'
    );
    this.projectId = projectId;
  }
  projectId: string;
}

export class CommitLockError extends DomainError {
  constructor(draftId: string) {
    super(
      `Draft ${draftId} is currently being committed by another process`,
      'COMMIT_LOCK_ERROR'
    );
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED');
  }
}
