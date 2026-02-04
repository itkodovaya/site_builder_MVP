/**
 * Dependency Injection Container
 * Wires up all dependencies
 */

import { Redis } from 'ioredis';
import { Config } from '../config';
import { createLogger } from '../lib/logger';
import { createRedisClient } from '../infrastructure/redis/RedisClient';
import { S3AssetStorage } from '../infrastructure/storage/S3AssetStorage';
import { MockAssetStorage } from '../infrastructure/storage/MockAssetStorage';
import { SiteDraftRepositoryRedis } from '../storage/SiteDraftRepositoryRedis';
import { SiteConfigGeneratorImpl } from '../config_generation/SiteConfigGeneratorImpl';
import { SafePreviewRenderer } from '../preview/SafePreviewRenderer';
import { FrappeRendererAdapter } from '../infrastructure/frappe/FrappeRendererAdapter';
import { loadFrappeConfig } from '../config/frappe';
import { CreateDraftUseCase } from '../application/usecases/CreateDraftUseCase';
import { UpdateDraftUseCase } from '../application/usecases/UpdateDraftUseCase';
import { GetDraftUseCase } from '../application/usecases/GetDraftUseCase';
import { GenerateSiteConfigUseCase } from '../application/usecases/GenerateSiteConfigUseCase';
import { GetPreviewUseCase } from '../application/usecases/GetPreviewUseCase';
import { CommitDraftUseCase } from '../application/usecases/CommitDraftUseCase';
import { DraftController } from '../api/controllers/DraftController';

export class DIContainer {
  private static instance: DIContainer;
  
  private redisClient!: Redis;
  public logger: any;
  
  // Repositories
  private draftRepository!: SiteDraftRepositoryRedis;
  
  // Storage
  private assetStorage!: S3AssetStorage;
  
  // Generators
  private configGenerator!: SiteConfigGeneratorImpl;
  
  // Renderers
  private previewRenderer!: SafePreviewRenderer;
  
  // Use cases
  private createDraftUseCase!: CreateDraftUseCase;
  private updateDraftUseCase!: UpdateDraftUseCase;
  private getDraftUseCase!: GetDraftUseCase;
  private generateSiteConfigUseCase!: GenerateSiteConfigUseCase;
  private getPreviewUseCase!: GetPreviewUseCase;
  private commitDraftUseCase!: CommitDraftUseCase;
  
  // Controllers
  public draftController!: DraftController;

  private constructor(private config: Config) {
    this.logger = createLogger(this.config.server.logger);
  }

  static create(config: Config): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer(config);
      DIContainer.instance.initialize();
    }
    return DIContainer.instance;
  }

  private initialize(): void {
    this.logger.info('Initializing dependency injection container...');
    
    // Infrastructure
    this.redisClient = createRedisClient(this.config.redis);
    
    // Use MockAssetStorage for development (S3 not required)
    // In production, switch to S3AssetStorage
    const useMockStorage = process.env.ASSET_STORAGE_TYPE === 'mock' || !process.env.S3_ENDPOINT;
    this.assetStorage = useMockStorage 
      ? new MockAssetStorage()
      : new S3AssetStorage(this.config.s3);
    
    // Repositories
    this.draftRepository = new SiteDraftRepositoryRedis(this.redisClient);
    
    // Generators & Renderers
    // Create Frappe adapter (optional, shared between generator and renderer)
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DIContainer.ts:77',message:'before Frappe config load',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    const frappeConfig = loadFrappeConfig();
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DIContainer.ts:82',message:'after Frappe config load',data:{enabled:frappeConfig.enabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    let frappeAdapter;
    try {
      frappeAdapter = frappeConfig.enabled 
        ? new FrappeRendererAdapter(frappeConfig)
        : undefined;
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DIContainer.ts:89',message:'after Frappe adapter creation',data:{hasAdapter:!!frappeAdapter,isAvailable:frappeAdapter?.isAvailable()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DIContainer.ts:92',message:'Frappe adapter creation failed',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      frappeAdapter = undefined; // Fallback to no Frappe
    }
    
    this.configGenerator = new SiteConfigGeneratorImpl(frappeAdapter);
    
    // Create preview renderer with optional Frappe support
    this.previewRenderer = new SafePreviewRenderer(frappeAdapter);
    
    // Use cases
    this.createDraftUseCase = new CreateDraftUseCase(
      this.draftRepository,
      this.assetStorage,
      this.config.draft.ttlSeconds
    );
    this.updateDraftUseCase = new UpdateDraftUseCase(
      this.draftRepository,
      this.assetStorage
    );
    this.getDraftUseCase = new GetDraftUseCase(
      this.draftRepository
    );
    this.generateSiteConfigUseCase = new GenerateSiteConfigUseCase(
      this.draftRepository,
      this.configGenerator
    );
    this.getPreviewUseCase = new GetPreviewUseCase(
      this.draftRepository,
      this.configGenerator,
      this.previewRenderer
    );
    
    // CommitDraftUseCase requires ProjectRepository (PostgreSQL) and Redis
    // For MVP, we'll create a stub that throws "not implemented" or use a mock
    // TODO: Implement ProjectRepositoryPostgres when DB is ready
    this.commitDraftUseCase = new CommitDraftUseCase(
      this.draftRepository,
      null as any, // ProjectRepository - will be implemented later
      this.configGenerator,
      this.redisClient
    );
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DIContainer.ts:140',message:'before DraftController creation',data:{hasCreateUseCase:!!this.createDraftUseCase,hasUpdateUseCase:!!this.updateDraftUseCase,hasGetDraftUseCase:!!this.getDraftUseCase,hasGenerateUseCase:!!this.generateSiteConfigUseCase,hasPreviewUseCase:!!this.getPreviewUseCase,hasCommitUseCase:!!this.commitDraftUseCase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Controllers
    this.draftController = new DraftController(
      this.createDraftUseCase,
      this.updateDraftUseCase,
      this.getDraftUseCase,
      this.getPreviewUseCase,
      this.commitDraftUseCase
    );

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DIContainer.ts:125',message:'after DraftController creation',data:{hasController:!!this.draftController},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    this.logger.info('Dependency injection container initialized successfully');
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down services...');
    
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.info('Redis connection closed');
    }
    
    this.logger.info('All services shut down successfully');
  }
}

