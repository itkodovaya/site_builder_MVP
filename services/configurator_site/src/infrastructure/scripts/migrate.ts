/**
 * Database Migration Script
 * Creates necessary tables in PostgreSQL
 */

import pkg from 'pg';
import dotenv from 'dotenv';
import { logger } from '../../shared/utils/logger.js';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  logger.info('Starting database migration...');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create Sites Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sites (
        site_id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        config JSONB NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        published_at TIMESTAMP WITH TIME ZONE,
        migrated_from VARCHAR(50)
      );
    `);

    // Create Index on User ID
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
    `);

    await client.query('COMMIT');
    logger.info('Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Migration failed');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
