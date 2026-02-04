/**
 * ProjectRepository Port
 * Interface for permanent project storage
 */

import { Project } from '../entities/Project';
import { ProjectConfig } from '../entities/ProjectConfig';
import { DraftId } from '../value-objects/DraftId';

export interface ProjectRepository {
  /**
   * Create project and config in a single transaction
   * Returns the created project and config
   * Throws if draftId already exists (idempotency)
   */
  createProjectWithConfig(
    project: Project,
    config: ProjectConfig
  ): Promise<{ project: Project; config: ProjectConfig }>;

  /**
   * Find project by ID
   */
  findProjectById(projectId: string): Promise<Project | null>;

  /**
   * Find project by original draft ID
   * Used for idempotency checks
   */
  findProjectByDraftId(draftId: DraftId): Promise<Project | null>;

  /**
   * Get config for a project
   */
  getProjectConfig(projectId: string): Promise<ProjectConfig | null>;

  /**
   * Check if a draft has already been committed
   */
  isDraftCommitted(draftId: DraftId): Promise<boolean>;
}

