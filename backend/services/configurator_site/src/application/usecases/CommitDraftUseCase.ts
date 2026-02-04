/**
 * CommitDraft Use Case
 * Migrates a temporary draft to permanent project storage
 * 
 * Flow:
 * 1. Acquire lock to prevent double-commit
 * 2. Check idempotency (draft already committed?)
 * 3. Load draft from Redis
 * 4. Generate publish-ready SiteConfig
 * 5. Persist to DB (Project + ProjectConfig) in transaction
 * 6. Delete draft from Redis
 * 7. Release lock
 * 8. Return projectId + configId
 */

import { DraftRepository } from '../../domain/ports/DraftRepository';
import { ProjectRepository } from '../../domain/ports/ProjectRepository';
import { SiteConfigGenerator } from '../../domain/ports/SiteConfigGenerator';
import { DraftId } from '../../domain/value-objects/DraftId';
import { Project, ProjectOwner } from '../../domain/entities/Project';
import { ProjectConfig } from '../../domain/entities/ProjectConfig';
import {
  DraftNotFoundError,
  DraftExpiredError,
  DraftAlreadyCommittedError,
  CommitLockError,
} from '../../domain/errors/DomainErrors';
import { Redis } from 'ioredis';

export interface CommitDraftInput {
  draftId: string;
  owner: ProjectOwner;
  idempotencyKey?: string; // Optional idempotency key from caller
}

export interface CommitDraftOutput {
  draftId: string;
  projectId: string;
  configId: string;
  status: 'MIGRATED' | 'ALREADY_COMMITTED';
  project?: any;
  config?: any;
}

export class CommitDraftUseCase {
  constructor(
    private readonly draftRepository: DraftRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly configGenerator: SiteConfigGenerator,
    private readonly redis: Redis,
    private readonly commitLockTtl: number = 30 // Lock TTL in seconds
  ) {}

  async execute(input: CommitDraftInput): Promise<CommitDraftOutput> {
    const draftId = DraftId.fromString(input.draftId);
    const lockKey = `lock:commit:${draftId.toString()}`;

    try {
      // Step 1: Acquire lock to prevent concurrent commits
      const lockAcquired = await this.acquireLock(lockKey);
      if (!lockAcquired) {
        throw new CommitLockError(input.draftId);
      }

      // Step 2: Check idempotency - has this draft already been committed?
      const existingProject = await this.projectRepository.findProjectByDraftId(draftId);
      if (existingProject) {
        const existingConfig = await this.projectRepository.getProjectConfig(
          existingProject.projectId
        );

        // Draft already committed - return existing project (idempotent)
        return {
          draftId: input.draftId,
          projectId: existingProject.projectId,
          configId: existingConfig?.configId || '',
          status: 'ALREADY_COMMITTED',
          project: existingProject.toJSON(),
          config: existingConfig?.toJSON(),
        };
      }

      // Step 3: Load draft from Redis
      const draft = await this.draftRepository.findById(draftId, false);
      if (!draft) {
        throw new DraftNotFoundError(input.draftId);
      }

      if (draft.isExpired()) {
        throw new DraftExpiredError(input.draftId);
      }

      // Step 4: Generate publish-ready SiteConfig
      const siteConfig = await this.configGenerator.generate(draft);

      // Step 5: Persist to DB (transaction)
      const project = Project.fromDraft(draftId, input.owner);
      const projectConfig = ProjectConfig.fromSiteConfig(project.projectId, siteConfig);

      const { project: savedProject, config: savedConfig } =
        await this.projectRepository.createProjectWithConfig(project, projectConfig);

      // Step 6: Delete draft from Redis (cleanup)
      try {
        await this.draftRepository.delete(draftId);
      } catch (error) {
        // Non-critical - draft will expire naturally via TTL
        console.warn(`Failed to delete draft ${input.draftId} from Redis:`, error);
      }

      // Step 7: Release lock
      await this.releaseLock(lockKey);

      // Step 8: Return permanent identifiers
      return {
        draftId: input.draftId,
        projectId: savedProject.projectId,
        configId: savedConfig.configId,
        status: 'MIGRATED',
        project: savedProject.toJSON(),
        config: savedConfig.toJSON(),
      };
    } catch (error) {
      // Always release lock on error
      await this.releaseLock(lockKey);
      throw error;
    }
  }

  /**
   * Acquire distributed lock via Redis
   * SET lock:commit:{draftId} 1 NX EX {ttl}
   */
  private async acquireLock(lockKey: string): Promise<boolean> {
    const result = await this.redis.set(lockKey, '1', 'EX', this.commitLockTtl, 'NX');
    return result === 'OK';
  }

  /**
   * Release distributed lock
   * DEL lock:commit:{draftId}
   */
  private async releaseLock(lockKey: string): Promise<void> {
    try {
      await this.redis.del(lockKey);
    } catch (error) {
      // Non-critical - lock will expire naturally
      console.warn(`Failed to release lock ${lockKey}:`, error);
    }
  }
}

