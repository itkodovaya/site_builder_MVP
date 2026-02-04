/**
 * Create Draft Use Case
 * Handles anonymous draft site creation
 */

import { IDraftRepository } from '../../infrastructure/storage/interfaces/IDraftRepository.js';
import { IAssetRepository } from '../../infrastructure/storage/interfaces/IAssetRepository.js';
import { SiteConfigFactory } from '../../domain/entities/SiteConfig.js';
import { DraftSiteFactory } from '../../domain/entities/DraftSite.js';
import { CreateDraftDTO, DraftResponseDTO } from '../dtos/DraftDTOs.js';
import { IdGenerator } from '../../shared/utils/idGenerator.js';
import { validateIndustry } from '../../shared/constants/industries.js';
import { InvalidIndustryError } from '../../shared/errors/ValidationError.js';
import { AssetNotFoundError } from '../../shared/errors/NotFoundError.js';
import { AssetFactory } from '../../domain/entities/Asset.js';
import { logger } from '../../shared/utils/logger.js';

export class CreateDraftUseCase {
  constructor(
    private readonly draftRepository: IDraftRepository,
    private readonly assetRepository: IAssetRepository,
    private readonly draftTTLSeconds: number,
    private readonly previewBaseUrl: string
  ) {}

  async execute(dto: CreateDraftDTO): Promise<DraftResponseDTO> {
    // Validate industry
    const industryValidation = validateIndustry(
      dto.industry.category,
      dto.industry.subcategory
    );

    if (!industryValidation.valid) {
      throw new InvalidIndustryError(
        dto.industry.category,
        dto.industry.subcategory
      );
    }

    // Validate logo asset exists
    const asset = await this.assetRepository.get(dto.logoAssetId);
    if (!asset) {
      throw new AssetNotFoundError(dto.logoAssetId);
    }

    // Create SiteConfig
    const config = SiteConfigFactory.create(
      dto.brandName,
      {
        category: dto.industry.category,
        subcategory: dto.industry.subcategory,
        tags: dto.industry.tags,
      },
      {
        assetId: asset.assetId,
        url: asset.storage.url,
        format: AssetFactory.getFormatFromMimeType(asset.mimeType),
        dimensions: asset.dimensions || { width: 0, height: 0 },
      },
      dto.theme
    );

    // Create Draft
    const draftId = IdGenerator.generateDraftId();
    const draft = DraftSiteFactory.create(
      draftId,
      config,
      this.draftTTLSeconds,
      {
        createdFrom: dto.metadata?.createdFrom || 'web',
        ipAddress: dto.metadata?.ipAddress,
        sessionId: dto.metadata?.sessionId,
      }
    );

    // Save to repository
    await this.draftRepository.create(draft);

    logger.info(
      {
        draftId,
        brandName: dto.brandName,
        industry: dto.industry,
      },
      'Draft created successfully'
    );

    // Return response
    return {
      draftId: draft.draftId,
      previewUrl: `${this.previewBaseUrl}/api/v1/drafts/${draft.draftId}/preview`,
      config,
      status: draft.status,
      ttl: {
        createdAt: draft.ttl.createdAt.toISOString(),
        expiresAt: draft.ttl.expiresAt.toISOString(),
        remainingSeconds: DraftSiteFactory.getRemainingSeconds(draft),
      },
    };
  }
}
