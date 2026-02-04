/**
 * GenerateSiteConfig Use Case
 * Builds SiteConfig from Draft using generator/template strategy
 */

import { DraftRepository } from '../../domain/ports/DraftRepository';
import { SiteConfigGenerator } from '../../domain/ports/SiteConfigGenerator';
import { DraftId } from '../../domain/value-objects/DraftId';
import { DraftNotFoundError, DraftExpiredError } from '../../domain/errors/DomainErrors';

export interface GenerateSiteConfigOutput {
  version: string;
  brandName: string;
  industry: string;
  logoUrl: string | null;
  theme: {
    name: string;
    primaryColor: string;
    secondaryColor?: string;
    fontFamily: string;
    layout: string;
  };
  pages: any;
  metadata: {
    title: string;
    description: string;
  };
  contact: {
    email?: string;
    phone?: string;
    address?: string;
  };
  social: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  generatedAt: string;
}

export class GenerateSiteConfigUseCase {
  constructor(
    private readonly draftRepository: DraftRepository,
    private readonly configGenerator: SiteConfigGenerator
  ) {}

  async execute(draftId: string): Promise<GenerateSiteConfigOutput> {
    const id = DraftId.fromString(draftId);
    const draft = await this.draftRepository.findById(id);

    if (!draft) {
      throw new DraftNotFoundError(draftId);
    }

    if (draft.isExpired()) {
      throw new DraftExpiredError(draftId);
    }

    const siteConfig = await this.configGenerator.generate(draft);

    return siteConfig.toJSON();
  }
}

