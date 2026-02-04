/**
 * Commit Draft Use Case
 * Migrates a temporary draft to a permanent site
 */

import { IDraftRepository } from '../../infrastructure/storage/interfaces/IDraftRepository.js';
import { ISiteRepository } from '../../infrastructure/storage/interfaces/ISiteRepository.js';
import { IAssetRepository } from '../../infrastructure/storage/interfaces/IAssetRepository.js';
import { PublishedSiteFactory } from '../../domain/entities/PublishedSite.js';
import { DraftNotFoundError, AppError } from '../../shared/errors/NotFoundError.js';
import { CommitDraftDTO, CommitResponseDTO } from '../dtos/DraftDTOs.js';
import { IdGenerator } from '../../shared/utils/idGenerator.js';
import { logger } from '../../shared/utils/logger.js';

export class CommitDraftUseCase {
  constructor(
    private readonly draftRepository: IDraftRepository,
    private readonly siteRepository: ISiteRepository,
    private readonly assetRepository: IAssetRepository
  ) {}

  async execute(draftId: string, dto: CommitDraftDTO): Promise<CommitResponseDTO> {
    // 1. Get Draft
    const draft = await this.draftRepository.get(draftId);
    if (!draft) {
      throw new DraftNotFoundError(draftId);
    }

    // 2. Prepare Config for Migration
    // (Here we might move assets to permanent buckets if implemented)
    // For MVP, we assume assets are accessible or we flip a flag.
    // Ideally:
    // const permanentLogo = await this.assetRepository.copyToPermanent(draft.config.branding.logo.assetId);
    // draft.config.branding.logo = permanentLogo;

    // 3. Create Published Site
    const siteId = IdGenerator.generateSiteId();
    const publishedSite = PublishedSiteFactory.createFromDraft(
      siteId,
      dto.userId,
      draft.config,
      draftId
    );

    // 4. Save to Permanent Storage
    await this.siteRepository.create(publishedSite);

    // 5. Cleanup Draft (Optional: keep for a bit, or delete immediately)
    // Deleting immediately for strict cleanup
    await this.draftRepository.delete(draftId);

    logger.info({ siteId, draftId, userId: dto.userId }, 'Draft committed and migrated to permanent site');

    return {
      siteId: publishedSite.siteId,
      draftId: draftId,
      userId: publishedSite.userId,
      config: publishedSite.config,
      migratedAt: new Date().toISOString(),
      editUrl: `/sites/${publishedSite.siteId}/edit`
    };
  }
}
