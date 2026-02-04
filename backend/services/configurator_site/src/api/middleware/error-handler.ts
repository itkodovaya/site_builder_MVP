/**
 * Global Error Handler
 * Handles all errors and maps them to proper HTTP responses
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { DomainError } from '../../domain/errors/DomainErrors';
import { mapDomainErrorToHttp } from './error-mapper';
import { errorResponse } from '../dto/ResponseEnvelope';

export async function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error
  request.log.error(error, {
    method: request.method,
    url: request.url,
    requestId: request.id,
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send(
      errorResponse(
        'VALIDATION_ERROR',
        'Request validation failed',
        error.errors,
        request.id
      )
    );
  }

  // Handle domain errors
  if (error instanceof DomainError) {
    const httpError = mapDomainErrorToHttp(error);
    return reply.status(httpError.statusCode).send(
      errorResponse(
        httpError.code,
        httpError.message,
        httpError.details,
        request.id
      )
    );
  }

  // Handle Fastify validation errors
  if ('validation' in error && error.validation) {
    return reply.status(400).send(
      errorResponse(
        'VALIDATION_ERROR',
        'Request validation failed',
        error.validation,
        request.id
      )
    );
  }

  // Handle other Fastify errors
  if ('statusCode' in error) {
    return reply.status(error.statusCode || 500).send(
      errorResponse(
        error.code || 'INTERNAL_ERROR',
        error.message,
        undefined,
        request.id
      )
    );
  }

  // Default error response
  return reply.status(500).send(
    errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      request.id
    )
  );
}
