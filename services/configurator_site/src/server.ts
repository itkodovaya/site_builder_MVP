import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import Redis from 'ioredis';
import { Client as MinioClient } from 'minio';

// Domain & Infrastructure
import { RedisDraftRepository } from './infrastructure/storage/repositories/RedisDraftRepository.js';
import { PostgresSiteRepository } from './infrastructure/storage/repositories/PostgresSiteRepository.js';
import { S3AssetRepository } from './infrastructure/storage/repositories/S3AssetRepository.js';
import { PreviewRendererService } from './infrastructure/preview/PreviewRenderer.js';
import { CreateDraftUseCase } from './application/usecases/CreateDraftUseCase.js';
import { CommitDraftUseCase } from './application/usecases/CommitDraftUseCase.js';
import { DraftController } from './presentation/controllers/DraftController.js';
import { AppError } from './shared/errors/AppError.js';
import { logger } from './shared/utils/logger.js';

// Load env vars
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app: FastifyInstance = fastify({
    logger: true, // Use built-in logger wrapper or pass our pino instance
    disableRequestLogging: false
  });

  // Register Middleware
  await app.register(cors, {
    origin: (process.env.ALLOWED_ORIGINS || '*').split(','),
    credentials: false // Anonymous only based on spec, except commit which is S2S
  });

  await app.register(multipart, {
    limits: {
      fileSize: parseInt(process.env.MAX_LOGO_SIZE_MB || '5') * 1024 * 1024,
    }
  });

  await app.register(rateLimit, {
    max: 100, // global limit
    timeWindow: '1 minute'
  });

  // Initialize Infrastructure
  
  // Redis
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0')
  });

  // Storage (MinIO/S3)
  const minioClient = new MinioClient({
    endPoint: (process.env.STORAGE_ENDPOINT || 'localhost').replace(/http:\/\/|https:\/\//, ''),
    port: 9000, // Should be parsable from endpoint or separate
    useSSL: process.env.STORAGE_USE_SSL === 'true',
    accessKey: process.env.STORAGE_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.STORAGE_SECRET_KEY || 'minioadmin'
  });

  // Postgres connection
  const pgPool = new pkg.Pool({
    connectionString: process.env.DATABASE_URL
  });

  const draftRepo = new RedisDraftRepository(redis);
  const siteRepo = new PostgresSiteRepository(pgPool);
  
  const assetRepo = new S3AssetRepository(
    minioClient,
    process.env.STORAGE_BUCKET_DRAFTS || 'draft-assets',
    process.env.STORAGE_BUCKET_PERMANENT || 'site-assets',
    process.env.STORAGE_PUBLIC_URL || 'http://localhost:9000'
  );

  const templateDir = path.join(__dirname, 'infrastructure/preview/templates');
  const previewRenderer = new PreviewRendererService(templateDir);

  // Initialize Use Cases
  const draftTTL = parseInt(process.env.DRAFT_TTL_SECONDS || '86400');
  const createDraftUseCase = new CreateDraftUseCase(
    draftRepo,
    assetRepo,
    draftTTL,
    process.env.PREVIEW_BASE_URL || 'http://localhost:3000'
  );
  
  const commitDraftUseCase = new CommitDraftUseCase(
    draftRepo,
    siteRepo,
    assetRepo
  );

  // Initialize Controller
  const draftController = new DraftController(
    createDraftUseCase,
    commitDraftUseCase,
    draftRepo,
    assetRepo,
    previewRenderer
  );

  // Register Routes
  app.post('/api/v1/drafts', draftController.create.bind(draftController));
  app.get('/api/v1/drafts/:draftId', draftController.get.bind(draftController));
  app.patch('/api/v1/drafts/:draftId', draftController.update.bind(draftController));
  app.get('/api/v1/drafts/:draftId/preview', draftController.preview.bind(draftController));
  app.post('/api/v1/drafts/:draftId/commit', draftController.commit.bind(draftController));
  app.post('/api/v1/assets/logo', draftController.uploadLogo.bind(draftController));

  // Health Check
  app.get('/health', async () => {
    return { 
      status: 'healthy', 
      timestamp: new Date(), 
      services: {
        redis: redis.status === 'ready' ? 'up' : 'down'
      } 
    };
  });

  // Global Error Handler
  app.setErrorHandler((error, request, reply) => {
    logger.error({ err: error }, 'Request error');

    if (error instanceof AppError) {
      return reply.code(error.statusCode).send(error.toJSON());
    }

    // Fastify errors
    if (error.validation) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          statusCode: 400
        }
      });
    }

    // Fallback
    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error',
        statusCode: 500
      }
    });
  });

  // Start Server
  const port = parseInt(process.env.PORT || '3000');
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    logger.info(`Server running at http://${host}:${port}`);
    
    // Ensure buckets exist (in dev only)
    if (process.env.NODE_ENV === 'development') {
       const draftBucket = process.env.STORAGE_BUCKET_DRAFTS || 'draft-assets';
       const exists = await minioClient.bucketExists(draftBucket);
       if (!exists) {
         await minioClient.makeBucket(draftBucket, 'us-east-1');
         logger.info(`Created bucket: ${draftBucket}`);
         // Set public policy... (simplified for now)
       }
    }

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

startServer();
