/**
 * PostgreSQL implementation of site repository
 */

import pkg from 'pg';
const { Pool } = pkg;
import { ISiteRepository } from '../interfaces/ISiteRepository.js';
import { PublishedSite, SiteStatus } from '../../../domain/entities/PublishedSite.js';
import { logger } from '../../../shared/utils/logger.js';

export class PostgresSiteRepository implements ISiteRepository {
  constructor(private readonly pool: pkg.Pool) {}

  async create(site: PublishedSite): Promise<string> {
    const query = `
      INSERT INTO sites (
        site_id, 
        user_id, 
        config, 
        status, 
        created_at, 
        updated_at, 
        migrated_from
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING site_id
    `;

    const values = [
      site.siteId,
      site.userId,
      JSON.stringify(site.config),
      site.status,
      site.ownership.createdAt,
      site.metadata.lastUpdatedAt,
      site.ownership.migratedFrom
    ];

    try {
      await this.pool.query(query, values);
      logger.info({ siteId: site.siteId }, 'Site created in Postgres');
      return site.siteId;
    } catch (error) {
      logger.error({ error, siteId: site.siteId }, 'Failed to create site in DB');
      throw error;
    }
  }

  async get(siteId: string): Promise<PublishedSite | null> {
    const query = 'SELECT * FROM sites WHERE site_id = $1';
    const result = await this.pool.query(query, [siteId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async getByUserId(userId: string): Promise<PublishedSite[]> {
    const query = 'SELECT * FROM sites WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);

    return result.rows.map(row => this.mapRowToEntity(row));
  }

  async updateConfig(siteId: string, config: any): Promise<void> {
    const query = `
      UPDATE sites 
      SET config = $1, updated_at = NOW() 
      WHERE site_id = $2
    `;
    await this.pool.query(query, [JSON.stringify(config), siteId]);
  }

  private mapRowToEntity(row: any): PublishedSite {
    return {
      siteId: row.site_id,
      userId: row.user_id,
      config: row.config, // pg automatically parses JSON columns
      status: row.status as SiteStatus,
      ownership: {
        ownerId: row.user_id,
        createdAt: row.created_at,
        migratedFrom: row.migrated_from
      },
      metadata: {
        publishedAt: row.published_at,
        lastUpdatedAt: row.updated_at
      }
    };
  }
}
