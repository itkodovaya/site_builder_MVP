/**
 * Draft Controller
 * Handles HTTP requests for draft operations
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDraftUseCase } from '../../application/usecases/CreateDraftUseCase';
import { UpdateDraftUseCase } from '../../application/usecases/UpdateDraftUseCase';
import { GetDraftUseCase } from '../../application/usecases/GetDraftUseCase';
import { GetPreviewUseCase } from '../../application/usecases/GetPreviewUseCase';
import { CommitDraftUseCase } from '../../application/usecases/CommitDraftUseCase';
import {
  DraftNotFoundError,
  DraftExpiredError,
  AssetNotFoundError,
  DraftAlreadyCommittedError,
  CommitLockError,
  UnauthorizedError,
} from '../../domain/errors/DomainErrors';
import { CreateDraftRequestSchema, UpdateDraftRequestSchema } from '../dto/DraftDTOs';

export class DraftController {
  constructor(
    private readonly createDraftUseCase: CreateDraftUseCase,
    private readonly updateDraftUseCase: UpdateDraftUseCase,
    private readonly getDraftUseCase: GetDraftUseCase,
    private readonly getPreviewUseCase: GetPreviewUseCase,
    private readonly commitDraftUseCase: CommitDraftUseCase
  ) {}

  /**
   * POST /api/v1/drafts
   */
  async createDraft(
    request: FastifyRequest<{ Body: unknown }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Validate request body
      const body = CreateDraftRequestSchema.parse(request.body);

      // Execute use case
      const result = await this.createDraftUseCase.execute({
        brandName: body.brandName,
        industry: body.industry,
        logo: body.logo,
        meta: {
          ipHash: this.hashIp(request.ip),
          userAgentHash: this.hashUserAgent(request.headers['user-agent']),
          source: 'web',
        },
      });

      reply.code(201).send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * PATCH /api/v1/drafts/:draft_id
   */
  async updateDraft(
    request: FastifyRequest<{ Params: { draft_id: string }; Body: unknown }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { draft_id } = request.params;
      const body = UpdateDraftRequestSchema.parse(request.body);

      const result = await this.updateDraftUseCase.execute({
        draftId: draft_id,
        ...body,
      });

      reply.send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /api/v1/drafts/:draft_id
   */
  async getDraft(
    request: FastifyRequest<{ Params: { draft_id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { draft_id } = request.params;

      const result = await this.getDraftUseCase.execute({
        draftId: draft_id,
      });

      reply.send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /api/v1/drafts/:draft_id/preview
   */
  async getPreview(
    request: FastifyRequest<{
      Params: { draft_id: string };
      Querystring: { type?: string };
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { draft_id } = request.params;
      const previewType = (request.query.type as 'html' | 'json') || 'html';

      const result = await this.getPreviewUseCase.execute({
        draftId: draft_id,
        type: previewType,
      });

      // Set ETag header for caching
      reply.header('ETag', result.etag);

      // Check If-None-Match for 304 response
      const ifNoneMatch = request.headers['if-none-match'];
      if (ifNoneMatch === result.etag) {
        reply.code(304).send();
        return;
      }

      // Return preview
      reply.send({
        draftId: draft_id,
        preview: {
          type: result.type,
          ...(result.type === 'html' ? { content: result.content } : { model: result.model }),
          generatedAt: result.generatedAt,
          etag: result.etag,
        },
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * GET /p/:draft_id
   * Direct HTML preview (browser-friendly)
   */
  async getPreviewHtml(
    request: FastifyRequest<{ Params: { draft_id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { draft_id } = request.params;

      const result = await this.getPreviewUseCase.execute({
        draftId: draft_id,
        type: 'html',
      });

      // Set headers
      reply.header('Content-Type', 'text/html; charset=utf-8');
      reply.header('ETag', result.etag);

      // Check If-None-Match
      const ifNoneMatch = request.headers['if-none-match'];
      if (ifNoneMatch === result.etag) {
        reply.code(304).send();
        return;
      }

      // Return raw HTML
      reply.send(result.content);
    } catch (error) {
      // For HTML endpoint, return HTML error page
      if (error instanceof DraftNotFoundError || error instanceof DraftExpiredError) {
        reply.code(404).type('text/html').send(`
          <!DOCTYPE html>
          <html>
          <head><title>Draft Not Found</title></head>
          <body>
            <h1>Draft Not Found</h1>
            <p>This draft has expired or does not exist.</p>
          </body>
          </html>
        `);
      } else {
        reply.code(500).type('text/html').send(`
          <!DOCTYPE html>
          <html>
          <head><title>Error</title></head>
          <body>
            <h1>Error</h1>
            <p>An error occurred while generating the preview.</p>
          </body>
          </html>
        `);
      }
    }
  }

  /**
   * POST /api/v1/drafts/:draft_id/commit
   * Server-to-server only - requires internal authentication
   */
  async commitDraft(
    request: FastifyRequest<{
      Params: { draft_id: string };
      Body: {
        owner: {
          userId: string;
          tenantId?: string;
        };
      };
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { draft_id } = request.params;
      const { owner } = request.body;

      // Validate owner
      if (!owner || !owner.userId) {
        reply.code(400).send({
          error: 'InvalidInput',
          message: 'owner.userId is required',
        });
        return;
      }

      // Get idempotency key from header (optional)
      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;

      // Execute commit
      const result = await this.commitDraftUseCase.execute({
        draftId: draft_id,
        owner,
        idempotencyKey,
      });

      // Return 200 for ALREADY_COMMITTED (idempotent), 201 for MIGRATED
      const statusCode = result.status === 'ALREADY_COMMITTED' ? 200 : 201;
      reply.code(statusCode).send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * Error handler - maps domain errors to HTTP responses
   */
  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof DraftNotFoundError) {
      reply.code(404).send({
        error: 'DraftNotFound',
        message: error.message,
      });
    } else if (error instanceof DraftExpiredError) {
      reply.code(410).send({
        error: 'DraftExpired',
        message: error.message,
      });
    } else if (error instanceof AssetNotFoundError) {
      reply.code(404).send({
        error: 'AssetNotFound',
        message: error.message,
      });
    } else if (error instanceof DraftAlreadyCommittedError) {
      reply.code(409).send({
        error: 'DraftAlreadyCommitted',
        message: error.message,
        projectId: error.projectId,
      });
    } else if (error instanceof CommitLockError) {
      reply.code(409).send({
        error: 'CommitInProgress',
        message: error.message,
      });
    } else if (error instanceof UnauthorizedError) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: error.message,
      });
    } else if ((error as any).name === 'ZodError') {
      reply.code(400).send({
        error: 'InvalidInput',
        message: 'Request validation failed',
        details: (error as any).errors,
      });
    } else {
      console.error('Unexpected error:', error);
      reply.code(500).send({
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * Hash IP for privacy
   */
  private hashIp(ip: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
  }

  /**
   * Hash User-Agent for privacy
   */
  private hashUserAgent(userAgent: string | undefined): string {
    if (!userAgent) return 'unknown';
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(userAgent).digest('hex').substring(0, 16);
  }
}
