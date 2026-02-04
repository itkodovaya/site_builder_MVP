/**
 * Internal Authentication Middleware
 * Validates server-to-server requests
 * 
 * Security: Checks X-Internal-Token header
 * No user authentication - only service authentication
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '../../domain/errors/DomainErrors';

export interface InternalAuthConfig {
  internalToken: string;
  headerName?: string;
}

export function createInternalAuthMiddleware(config: InternalAuthConfig) {
  const headerName = config.headerName || 'x-internal-token';

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const token = request.headers[headerName];

    if (!token) {
      throw new UnauthorizedError('Missing internal authentication token');
    }

    if (token !== config.internalToken) {
      throw new UnauthorizedError('Invalid internal authentication token');
    }

    // Token valid - allow request to proceed
  };
}

/**
 * Alternative: mTLS authentication
 * Validates client certificate for service-to-service calls
 */
export function createMtlsAuthMiddleware() {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Check for client certificate
    const socket = (request.raw as any).socket;
    const cert = socket.getPeerCertificate();

    if (!cert || !cert.subject) {
      throw new UnauthorizedError('Missing client certificate');
    }

    // Validate certificate subject (whitelist of trusted services)
    const trustedServices = [
      'CN=auth-service',
      'CN=user-service',
      // Add other trusted services
    ];

    const certSubject = `CN=${cert.subject.CN}`;
    if (!trustedServices.includes(certSubject)) {
      throw new UnauthorizedError('Untrusted client certificate');
    }

    // Certificate valid - allow request to proceed
  };
}

