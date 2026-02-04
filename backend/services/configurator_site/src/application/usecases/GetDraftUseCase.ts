/**
 * GetDraft Use Case
 * Retrieves current draft state (no TTL refresh)
 */

import { DraftRepository } from '../../domain/ports/DraftRepository';
import { DraftId } from '../../domain/value-objects/DraftId';
import { DraftNotFoundError, DraftExpiredError } from '../../domain/errors/DomainErrors';

export interface GetDraftInput {
  draftId: string;
}

export interface GetDraftOutput {
  draftId: string;
  status: string;
  createdAt: string;
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

export class GetDraftUseCase {
  constructor(private readonly draftRepository: DraftRepository) {}

  async execute(input: GetDraftInput): Promise<GetDraftOutput> {
    // Load draft (no TTL refresh on pure read)
    const draftId = DraftId.fromString(input.draftId);
    const draft = await this.draftRepository.findById(draftId, false);

    if (!draft) {
      throw new DraftNotFoundError(input.draftId);
    }

    if (draft.isExpired()) {
      throw new DraftExpiredError(input.draftId);
    }

    // Return output
    return {
      draftId: draft.draftId.toString(),
      status: draft.status,
      createdAt: draft.createdAt.toISOString(),
      updatedAt: draft.updatedAt.toISOString(),
      expiresAt: draft.expiresAt.toISOString(),
      brandProfile: {
        brandName: draft.brandProfile.getBrandName().toString(),
        industry: {
          code: draft.brandProfile.getIndustry().getCode(),
          label: draft.brandProfile.getIndustry().getLabel(),
        },
        logo: draft.brandProfile.getLogo() ? {
          assetId: draft.brandProfile.getLogo()!.getAssetId(),
          url: draft.brandProfile.getLogo()!.getUrl(),
        } : undefined,
      },
    };
  }
}

