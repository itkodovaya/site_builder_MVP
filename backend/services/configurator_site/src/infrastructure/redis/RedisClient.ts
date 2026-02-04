/**
 * Redis Client
 * Configured Redis connection
 */

import Redis from 'ioredis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export function createRedisClient(config: RedisConfig): Redis {
  const client = new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.db || 0,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true, // Don't connect immediately - allow server to start
    maxRetriesPerRequest: 3,
    enableReadyCheck: false, // Don't wait for ready state
  });

  client.on('error', (err) => {
    console.error('Redis connection error:', err.message);
    // Don't crash on Redis errors - allow graceful degradation
  });

  client.on('connect', () => {
    console.log('Redis connected successfully');
  });

  // Try to connect, but don't block
  client.connect().catch((err) => {
    console.warn('Redis initial connection failed, will retry:', err.message);
  });

  return client;
}

