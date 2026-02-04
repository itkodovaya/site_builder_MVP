/**
 * Response Envelope
 * Consistent response structure for all API endpoints
 */

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    requestId?: string;
    timestamp: string;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId?: string;
    timestamp: string;
  };
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export function successResponse<T>(data: T, requestId?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

export function errorResponse(code: string, message: string, details?: any, requestId?: string): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

