/**
 * Fastify Server Factory
 * Creates and configures Fastify server instance
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { errorHandler } from '../../api/middleware/error-handler';
import { registerRoutes } from '../../api/routes';
import { DraftController } from '../../api/controllers/DraftController';

export interface ServerConfig {
  host: string;
  port: number;
  logger: any;
  cors?: {
    origin: string | string[] | boolean;
  };
  rateLimit?: {
    max: number;
    timeWindow: string;
  };
}

export async function createFastifyServer(
  config: ServerConfig,
  draftController: DraftController
): Promise<FastifyInstance> {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FastifyServer.ts:27',message:'createFastifyServer entry',data:{hasController:!!draftController},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  const server = Fastify({
    logger: config.logger,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
    // Use Fastify's built-in request id generator (no require in ESM)
  });

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FastifyServer.ts:44',message:'before cors register',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  // CORS
  await server.register(cors, {
    origin: config.cors?.origin ?? true,
    credentials: true,
  });

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FastifyServer.ts:54',message:'before multipart register',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  // Multipart (for file uploads)
  await server.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1,
    },
  });

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FastifyServer.ts:64',message:'before rateLimit register',data:{hasRateLimit:!!config.rateLimit},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  // Rate limiting
  if (config.rateLimit) {
    await server.register(rateLimit, {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.timeWindow,
    });
  }

  // Error handler
  server.setErrorHandler(errorHandler);

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FastifyServer.ts:68',message:'before registerRoutes',data:{hasController:!!draftController},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Register routes
  await registerRoutes(server, draftController);

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FastifyServer.ts:71',message:'after registerRoutes',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  return server;
}

