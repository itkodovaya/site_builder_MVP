/**
 * PostgreSQL-based Project Repository
 * Implements permanent storage for projects and configs
 */

import { Pool } from 'pg';
import { ProjectRepository } from '../../domain/ports/ProjectRepository';
import { Project } from '../../domain/entities/Project';
import { ProjectConfig } from '../../domain/entities/ProjectConfig';
import { DraftId } from '../../domain/value-objects/DraftId';

export class ProjectRepositoryPostgres implements ProjectRepository {
  constructor(private readonly pool: Pool) {}

  /**
   * Create project and config in a single transaction
   * Ensures atomicity - both succeed or both fail
   * Unique constraint on draft_id provides idempotency
   */
  async createProjectWithConfig(
    project: Project,
    config: ProjectConfig
  ): Promise<{ project: Project; config: ProjectConfig }> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Insert project
      await client.query(
        `INSERT INTO projects (
          project_id,
          owner_user_id,
          owner_tenant_id,
          draft_id,
          created_at,
          updated_at,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          project.projectId,
          project.owner.userId,
          project.owner.tenantId || null,
          project.draftId.toString(),
          project.createdAt,
          project.updatedAt,
          project.status,
        ]
      );

      // Insert config
      await client.query(
        `INSERT INTO project_configs (
          config_id,
          project_id,
          schema_version,
          config_version,
          template_id,
          template_version,
          config_json,
          config_hash,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          config.configId,
          config.projectId,
          config.schemaVersion,
          config.configVersion,
          config.templateId,
          config.templateVersion,
          JSON.stringify(config.configJson),
          config.configHash,
          config.createdAt,
        ]
      );

      await client.query('COMMIT');

      return { project, config };
    } catch (error: any) {
      await client.query('ROLLBACK');

      // Check for unique constraint violation on draft_id
      if (error.code === '23505' && error.constraint === 'projects_draft_id_unique') {
        // Draft already committed - this is handled by idempotency check
        throw new Error(`Draft ${project.draftId.toString()} already committed`);
      }

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find project by ID
   */
  async findProjectById(projectId: string): Promise<Project | null> {
    const result = await this.pool.query(
      `SELECT * FROM projects WHERE project_id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProject(result.rows[0]);
  }

  /**
   * Find project by original draft ID
   */
  async findProjectByDraftId(draftId: DraftId): Promise<Project | null> {
    const result = await this.pool.query(
      `SELECT * FROM projects WHERE draft_id = $1`,
      [draftId.toString()]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProject(result.rows[0]);
  }

  /**
   * Get config for a project
   */
  async getProjectConfig(projectId: string): Promise<ProjectConfig | null> {
    const result = await this.pool.query(
      `SELECT * FROM project_configs WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToConfig(result.rows[0]);
  }

  /**
   * Check if a draft has already been committed
   */
  async isDraftCommitted(draftId: DraftId): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM projects WHERE draft_id = $1`,
      [draftId.toString()]
    );

    return result.rows.length > 0;
  }

  /**
   * Map database row to Project entity
   */
  private mapRowToProject(row: any): Project {
    return new Project(
      row.project_id,
      {
        userId: row.owner_user_id,
        tenantId: row.owner_tenant_id,
      },
      DraftId.fromString(row.draft_id),
      row.created_at,
      row.updated_at,
      row.status
    );
  }

  /**
   * Map database row to ProjectConfig entity
   */
  private mapRowToConfig(row: any): ProjectConfig {
    return new ProjectConfig(
      row.config_id,
      row.project_id,
      row.schema_version,
      row.config_version,
      row.template_id,
      row.template_version,
      row.config_json, // Already parsed by pg driver
      row.config_hash,
      row.created_at
    );
  }
}

