/**
 * Service Configuration
 * Environment schema and runtime configuration
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Server
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('localhost'), // Use localhost for better Windows compatibility
  
  // PostgreSQL (not used for MVP, but kept for future)
  POSTGRES_HOST: z.string().optional(),
  POSTGRES_PORT: z.string().transform(Number).optional(),
  POSTGRES_DB: z.string().optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  
  // Redis (TTL storage)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),
  
  // S3/MinIO (asset storage)
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_BUCKET: z.string().default('site-builder-assets'),
  S3_REGION: z.string().default('us-east-1'),
  S3_USE_SSL: z.string().transform((v) => v === 'true').default('false'),
  
  // Draft TTL
  DRAFT_TTL_SECONDS: z.string().transform(Number).default('86400'), // 24 hours
  
  // Preview
  PREVIEW_MODE: z.enum(['html', 'json']).default('html'),
  PREVIEW_BASE_URL: z.string().optional(),
  
  // Storage backend selection
  STORAGE_BACKEND: z.enum(['redis', 'db']).default('redis'),
  
  // Rate limiting
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  
  // CORS
  CORS_ORIGIN: z.string().default('*'),
});

const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  
  server: {
    port: env.PORT,
    host: env.HOST,
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      prettyPrint: env.NODE_ENV !== 'production',
    },
    cors: {
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    },
    rateLimit: {
      max: env.RATE_LIMIT_MAX,
      timeWindow: env.RATE_LIMIT_WINDOW,
    },
  },
  
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
  },
  
  s3: {
    endpoint: env.S3_ENDPOINT,
    accessKey: env.S3_ACCESS_KEY,
    secretKey: env.S3_SECRET_KEY,
    bucket: env.S3_BUCKET,
    region: env.S3_REGION,
    useSSL: env.S3_USE_SSL,
  },
  
  draft: {
    ttlSeconds: env.DRAFT_TTL_SECONDS,
    storageBackend: env.STORAGE_BACKEND,
  },
  
  preview: {
    mode: env.PREVIEW_MODE,
    baseUrl: env.PREVIEW_BASE_URL,
  },
} as const;

export type Config = typeof config;
