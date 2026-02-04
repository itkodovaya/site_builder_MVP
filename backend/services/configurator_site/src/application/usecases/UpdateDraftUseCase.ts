/**
 * UpdateDraft Use Case
 * Patches draft fields and refreshes TTL (sliding TTL)
 */

import { DraftRepository } from '../../domain/ports/DraftRepository';
import { AssetStorage } from '../../domain/ports/AssetStorage';
import { DraftId } from '../../domain/value-objects/DraftId';
import { IndustryInfo } from '../../domain/value-objects/IndustryInfo';
import { BrandProfile } from '../../domain/entities/BrandProfile';
import { DraftNotFoundError, DraftExpiredError, AssetNotFoundError } from '../../domain/errors/DomainErrors';

export interface UpdateDraftInput {
  draftId: string;
  brandName?: string;
  industry?: {
    code: string;
    label: string;
  };
  logo?: {
    assetId: string;
  };
}

export interface UpdateDraftOutput {
  draftId: string;
  status: string;
  updatedAt: string;
  expiresAt: string;
  brandProfile: {
    brandName: string;
    industry: {
      code: string;
      label: string;
    };
    logo: {
      assetId: string;
      url: string;
    };
  };
}

export class UpdateDraftUseCase {
  constructor(
    private readonly draftRepository: DraftRepository,
    private readonly assetStorage: AssetStorage
  ) {}

  async execute(input: UpdateDraftInput): Promise<UpdateDraftOutput> {
    // Load existing draft (with TTL refresh)
    const draftId = DraftId.fromString(input.draftId);
    const draft = await this.draftRepository.findById(draftId, false); // Don't refresh yet

    if (!draft) {
      throw new DraftNotFoundError(input.draftId);
    }

    if (draft.isExpired()) {
      throw new DraftExpiredError(input.draftId);
    }

    // Apply updates
    let updatedBrandName = draft.brandProfile.brandName;
    let updatedIndustry = draft.brandProfile.industry;
    let updatedLogo = draft.brandProfile.logo;

    if (input.brandName !== undefined) {
      updatedBrandName = input.brandName;
    }

    if (input.industry !== undefined) {
      updatedIndustry = IndustryInfo.create(input.industry.code, input.industry.label);
    }

    if (input.logo !== undefined) {
      // Validate asset exists
      const assetInfo = await this.assetStorage.getAssetInfo(input.logo.assetId);
      if (!assetInfo) {
        throw new AssetNotFoundError(input.logo.assetId);
      }
      updatedLogo = assetInfo;
    }

    // Create updated BrandProfile
    const updatedBrandProfile = draft.brandProfile.update({
      brandName: updatedBrandName,
      industryCode: updatedIndustry.getCode(),
      industryLabel: updatedIndustry.getLabel(),
      logo: updatedLogo,
    });

    // Update draft with new data + refresh timestamps
    const updatedDraft = draft.update(updatedBrandProfile);

    // Save with TTL refresh (sliding TTL on update)
    await this.draftRepository.update(updatedDraft);

    // Return output
    return {
      draftId: updatedDraft.draftId.toString(),
      status: updatedDraft.status,
      updatedAt: updatedDraft.updatedAt.toISOString(),
      expiresAt: updatedDraft.expiresAt.toISOString(),
      brandProfile: {
        brandName: updatedDraft.brandProfile.getBrandName().toString(),
        industry: {
          code: updatedDraft.brandProfile.getIndustry().getCode(),
          label: updatedDraft.brandProfile.getIndustry().getLabel(),
        },
        logo: updatedDraft.brandProfile.getLogo() ? {
          assetId: updatedDraft.brandProfile.getLogo()!.getAssetId(),
          url: updatedDraft.brandProfile.getLogo()!.getUrl(),
        } : undefined,
      },
    };
  }
}
