/**
 * Error Mapper
 * Maps domain errors to HTTP status codes
 */

import { 
  DomainError, 
  DraftNotFoundError, 
  DraftExpiredError, 
  InvalidDraftDataError 
} from '../../domain/errors/DomainErrors';

export interface HttpError {
  statusCode: number;
  code: string;
  message: string;
  details?: any;
}

export function mapDomainErrorToHttp(error: Error): HttpError {
  if (error instanceof DraftNotFoundError) {
    return {
      statusCode: 404,
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof DraftExpiredError) {
    return {
      statusCode: 410,
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof InvalidDraftDataError) {
    return {
      statusCode: 400,
      code: error.code,
      message: error.message,
      details: (error as InvalidDraftDataError).details,
    };
  }

  if (error instanceof DomainError) {
    return {
      statusCode: 500,
      code: error.code,
      message: error.message,
    };
  }

  // Unknown error
  return {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  };
}

