/**
 * Draft Controller
 * Handles HTTP requests for draft operations
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDraftUseCase } from '../../application/usecases/CreateDraftUseCase.js';
import { CommitDraftUseCase } from '../../application/usecases/CommitDraftUseCase.js';
import { CreateDraftDTO } from '../../application/dtos/DraftDTOs.js';
import { IDraftRepository } from '../../infrastructure/storage/interfaces/IDraftRepository.js';
import { IAssetRepository } from '../../infrastructure/storage/interfaces/IAssetRepository.js';
import { PreviewRendererService } from '../../infrastructure/preview/PreviewRenderer.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { AppError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/utils/logger.js';
import { DraftSiteFactory } from '../../domain/entities/DraftSite.js';
import { IdGenerator } from '../../shared/utils/idGenerator.js';

export class DraftController {
  constructor(
    private readonly createDraftUseCase: CreateDraftUseCase,
    private readonly commitDraftUseCase: CommitDraftUseCase,
    private readonly draftRepository: IDraftRepository,
    private readonly assetRepository: IAssetRepository,
    private readonly previewRenderer: PreviewRendererService
  ) {}

  /**
   * Create a new draft
   */
  async create(request: FastifyRequest<{ Body: CreateDraftDTO }>, reply: FastifyReply) {
    const dto = request.body;
    
    // Enrich with session metadata
    dto.metadata = {
      createdFrom: 'web',
      ipAddress: request.ip,
      ...dto.metadata
    };

    const result = await this.createDraftUseCase.execute(dto);
    
    return reply.code(201).send({
      success: true,
      data: result
    });
  }

  /**
   * Get draft by ID
   */
  async get(request: FastifyRequest<{ Params: { draftId: string } }>, reply: FastifyReply) {
    const { draftId } = request.params;
    
    const draft = await this.draftRepository.get(draftId);
    
    if (!draft) {
      throw new NotFoundError(`Draft ${draftId} not found`);
    }

    return reply.send({
      success: true,
      data: {
        draftId: draft.draftId,
        config: draft.config,
        status: draft.status,
        ttl: {
          createdAt: draft.ttl.createdAt,
          expiresAt: draft.ttl.expiresAt,
          remainingSeconds: DraftSiteFactory.getRemainingSeconds(draft)
        }
      }
    });
  }

  /**
   * Update draft configuration
   */
  async update(request: FastifyRequest<{ Params: { draftId: string }, Body: any }>, reply: FastifyReply) {
    const { draftId } = request.params;
    const updates = request.body;
    
    const draft = await this.draftRepository.get(draftId);
    
    if (!draft) {
      throw new NotFoundError(`Draft ${draftId} not found`);
    }

    // Deep merge config logic would go here
    // For MVP we simplistically merge specific fields or replace sections
    
    // Simulating config update
    // In a real app, use a proper ConfigUpdateService domain service
    const currentConfig = draft.config;
    
    if (updates.theme) {
      currentConfig.theme = { ...currentConfig.theme, ...updates.theme };
    }
    
    if (updates.brandName) {
      currentConfig.brandName = updates.brandName;
    }

    const updatedDraft = DraftSiteFactory.updateConfig(draft, currentConfig);
    
    if (process.env.REFRESH_TTL_ON_UPDATE === 'true') {
        const ttl = parseInt(process.env.DRAFT_TTL_SECONDS || '86400', 10);
        // We'd use a refreshTTL method on the repo, or just update logic
        // For simple Repo, we just save the updated draft which includes new 'lastAccessed'
    }

    await this.draftRepository.update(draftId, updatedDraft);

    return reply.send({
      success: true,
      data: {
        draftId,
        config: updatedDraft.config,
        ttl: {
          expiresAt: updatedDraft.ttl.expiresAt
        }
      }
    });
  }

  /**
   * Render preview
   */
  async preview(
    request: FastifyRequest<{ Params: { draftId: string }, Querystring: { format?: string } }>, 
    reply: FastifyReply
  ) {
    const { draftId } = request.params;
    const { format } = request.query;
    
    const draft = await this.draftRepository.get(draftId);
    
    if (!draft) {
      throw new NotFoundError(`Draft ${draftId} not found`);
    }

    const html = await this.previewRenderer.render(draft.config);

    if (format === 'json' || request.headers.accept === 'application/json') {
      return reply.send({
        success: true,
        data: {
          previewHtml: html,
          generatedAt: new Date()
        }
      });
    }

    // Default HTML response
    return reply
      .header('Content-Type', 'text/html')
      .send(html);
  }

  /**
   * Upload asset (Logo)
   */
  async uploadLogo(request: FastifyRequest, reply: FastifyReply) {
    const data = await request.file();
    
    if (!data) {
      throw new AppError('File is required', 400, 'VALIDATION_ERROR');
    }

    const buffer = await data.toBuffer();
    
    // Basic validation
    if (buffer.length > (parseInt(process.env.MAX_LOGO_SIZE_MB || '5') * 1024 * 1024)) {
       throw new AppError('File too large', 413, 'ASSET_TOO_LARGE');
    }

    const draftId = (data.fields.draftId as any)?.value;

    const asset = await this.assetRepository.upload(
      buffer,
      data.filename,
      data.mimetype,
      'logo',
      // If we had a draftId, we could look up its expiration
      // For now, default expiration
      new Date(Date.now() + 86400 * 1000) 
    );

    return reply.code(201).send({
      success: true,
      data: asset
    });
  }

  /**
   * Commit draft (Migrate to permanent)
   */
  async commit(request: FastifyRequest<{ Params: { draftId: string }, Body: any }>, reply: FastifyReply) {
    const { draftId } = request.params;
    const { userId, metadata } = request.body;
    const serviceToken = request.headers['x-service-token'];

    // 1. Validate service token (Basic check for MVP)
    if (serviceToken !== process.env.SERVICE_TOKEN) {
      throw new AppError('Invalid service token', 401, 'UNAUTHORIZED');
    }

    if (!userId) {
      throw new AppError('UserId is required', 400, 'VALIDATION_ERROR');
    }

    // 2. Execute Use Case
    const result = await this.commitDraftUseCase.execute(draftId, {
      userId,
      metadata
    });

    return reply.send({
      success: true,
      data: result
    });
  }
}
