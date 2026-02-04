/**
 * Route Registration
 * Registers all API routes
 */

import { FastifyInstance } from 'fastify';
import { draftRoutes } from './draft';
import { DraftController } from '../controllers/DraftController';
import { InternalAuthConfig } from '../middleware/internal-auth';

export async function registerRoutes(
  server: FastifyInstance,
  draftController: DraftController
) {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:11',message:'registerRoutes entry',data:{hasController:!!draftController},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  /**
   * Health check
   * GET /health
   */
  server.get('/health', async () => {
    return {
      status: 'ok',
      service: 'configurator_site',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  });

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:32',message:'before server.register api/v1',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  /**
   * API v1 routes
   * Base: /api/v1
   */
  await server.register(async (instance) => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:38',message:'inside api/v1 register',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Internal auth config from environment
    const internalAuthConfig: InternalAuthConfig = {
      internalToken: process.env.INTERNAL_TOKEN || 'default-internal-token',
      headerName: 'x-internal-token',
    };
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:45',message:'before draftRoutes register',data:{hasController:!!draftController},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    await instance.register(
      async (draftInstance) => draftRoutes(draftInstance, draftController, internalAuthConfig),
      { prefix: '/drafts' }
    );
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:50',message:'after draftRoutes register',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Direct HTML preview route (outside /drafts prefix)
    instance.get('/p/:draft_id', async (request, reply) => {
      return draftController.getPreviewHtml(request, reply);
    });
  }, { prefix: '/api/v1' });
  
  // Also register direct preview route at root level
  server.get('/p/:draft_id', async (request, reply) => {
    return draftController.getPreviewHtml(request, reply);
  });

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.ts:54',message:'registerRoutes exit',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
}
