/**
 * Draft Routes
 * API endpoints for draft operations
 */

import { FastifyInstance } from 'fastify';
import { DraftController } from '../controllers/DraftController';
import { createInternalAuthMiddleware, InternalAuthConfig } from '../middleware/internal-auth';

export async function draftRoutes(
  fastify: FastifyInstance,
  controller: DraftController,
  internalAuthConfig: InternalAuthConfig
): Promise<void> {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/draft.ts:10',message:'draftRoutes entry',data:{hasController:!!controller,hasConfig:!!internalAuthConfig},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Public endpoints (no auth)

  // Create draft
  fastify.post('/', async (request, reply) => {
    return controller.createDraft(request, reply);
  });

  // Update draft
  fastify.patch('/:draft_id', async (request, reply) => {
    return controller.updateDraft(request, reply);
  });

  // Get draft
  fastify.get('/:draft_id', async (request, reply) => {
    return controller.getDraft(request, reply);
  });

  // Get preview (JSON/HTML in JSON envelope)
  fastify.get('/:draft_id/preview', async (request, reply) => {
    return controller.getPreview(request, reply);
  });

  // Internal endpoints (require internal authentication)

  const internalAuth = createInternalAuthMiddleware(internalAuthConfig);

  // Commit draft (server-to-server only)
  fastify.post(
    '/:draft_id/commit',
    {
      preHandler: internalAuth,
    },
    async (request, reply) => {
      return controller.commitDraft(request, reply);
    }
  );
}
