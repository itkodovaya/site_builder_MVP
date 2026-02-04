/**
 * GetDraftConfig Use Case
 * Retrieves draft configuration (just the draft data)
 */

import { DraftRepository } from '../../domain/ports/DraftRepository';
import { DraftId } from '../../domain/value-objects/DraftId';
import { DraftNotFoundError, DraftExpiredError } from '../../domain/errors/DomainErrors';

export interface GetDraftConfigOutput {
  id: string;
  brandName: string;
  industry: string;
  logoRef: string | null;
  description?: string;
  primaryColor?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  createdAt: string;
  expiresAt: string;
  updatedAt?: string;
  ttlRemaining: number | null;
}

export class GetDraftConfigUseCase {
  constructor(private readonly draftRepository: DraftRepository) {}

  async execute(id: string): Promise<GetDraftConfigOutput> {
    const draftId = DraftId.fromString(id);
    const draft = await this.draftRepository.findById(draftId);

    if (!draft) {
      throw new DraftNotFoundError(id);
    }

    if (draft.isExpired()) {
      throw new DraftExpiredError(id);
    }

    const ttlRemaining = await this.draftRepository.getTTL(draftId);

    return {
      id: draft.getId().toString(),
      brandName: draft.getBrandName().toString(),
      industry: draft.getIndustry().toString(),
      logoRef: draft.getLogoRef()?.toString() || null,
      description: draft.getDescription(),
      primaryColor: draft.getPrimaryColor(),
      contactEmail: draft.getContactEmail(),
      contactPhone: draft.getContactPhone(),
      address: draft.getAddress(),
      socialLinks: draft.getSocialLinks(),
      createdAt: draft.getCreatedAt().toISOString(),
      expiresAt: draft.getExpiresAt().toISOString(),
      updatedAt: draft.getUpdatedAt()?.toISOString(),
      ttlRemaining,
    };
  }
}

