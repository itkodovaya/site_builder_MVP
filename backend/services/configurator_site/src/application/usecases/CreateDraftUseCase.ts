/**
 * CreateDraft Use Case
 * Creates a new draft with TTL policy
 */

import { DraftRepository } from '../../domain/ports/DraftRepository';
import { AssetStorage } from '../../domain/ports/AssetStorage';
import { SiteDraft } from '../../domain/entities/SiteDraft';
import { DraftId } from '../../domain/value-objects/DraftId';
import { BrandProfile } from '../../domain/entities/BrandProfile';
import { IndustryInfo } from '../../domain/value-objects/IndustryInfo';
import { AssetInfo } from '../../domain/value-objects/AssetInfo';
import { GeneratorInfo } from '../../domain/value-objects/GeneratorInfo';
import { PreviewInfo } from '../../domain/value-objects/PreviewInfo';
import { DraftMeta } from '../../domain/value-objects/DraftMeta';
import { AssetNotFoundError } from '../../domain/errors/DomainErrors';

export interface CreateDraftInput {
  brandName: string;
  industry: {
    code: string;
    label: string;
  };
  logo: {
    assetId: string;
  };
  meta?: {
    ipHash?: string;
    userAgentHash?: string;
    source?: string;
    notes?: string;
  };
}

export interface CreateDraftOutput {
  draftId: string;
  status: string;
  createdAt: string;
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

export class CreateDraftUseCase {
  constructor(
    private readonly draftRepository: DraftRepository,
    private readonly assetStorage: AssetStorage,
    private readonly defaultTtlSeconds: number = 86400 // 24 hours
  ) {}

  async execute(input: CreateDraftInput): Promise<CreateDraftOutput> {
    // Validate asset exists and get full info (if logo provided)
    let assetInfo: AssetInfo | undefined;
    if (input.logo?.assetId) {
      assetInfo = await this.assetStorage.getAssetInfo(input.logo.assetId);
      if (!assetInfo) {
        throw new AssetNotFoundError(input.logo.assetId);
      }
    }

    // Create domain entities
    const draftId = DraftId.generate();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.defaultTtlSeconds * 1000);

    const brandProfile = BrandProfile.create({
      brandName: input.brandName,
      industryCode: input.industry.code,
      industryLabel: input.industry.label,
      logo: assetInfo,
    });

    const generator = GeneratorInfo.create({
      engine: 'configurator_site',
      engineVersion: '0.1.0',
      templateId: 'default',
      locale: 'ru-RU',
    });

    const preview = PreviewInfo.empty('html');

    const meta = DraftMeta.create({
      ipHash: input.meta?.ipHash,
      userAgentHash: input.meta?.userAgentHash,
      source: input.meta?.source || 'web',
      notes: input.meta?.notes,
    });

    const draft = new SiteDraft(
      1, // schemaVersion
      draftId,
      'DRAFT',
      now,
      now,
      expiresAt,
      this.defaultTtlSeconds,
      brandProfile,
      generator,
      preview,
      meta
    );

    // Save to repository
    await this.draftRepository.save(draft);

    // Return output
    return {
      draftId: draft.draftId.toString(),
      status: draft.status,
      createdAt: draft.createdAt.toISOString(),
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
