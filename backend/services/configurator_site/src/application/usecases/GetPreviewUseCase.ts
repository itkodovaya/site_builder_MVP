/**
 * GetPreview Use Case
 * Renders preview with TTL refresh (activity tracking)
 * 
 * Pipeline:
 * 1. Load draft from Redis
 * 2. Refresh TTL (activity)
 * 3. Generate SiteConfig (deterministic)
 * 4. Render preview (safe, escaped)
 */

import { DraftRepository } from '../../domain/ports/DraftRepository';
import { SiteConfigGenerator } from '../../domain/ports/SiteConfigGenerator';
import { DraftId } from '../../domain/value-objects/DraftId';
import { DraftNotFoundError, DraftExpiredError } from '../../domain/errors/DomainErrors';
import { SafePreviewRenderer, PreviewOutput } from '../../preview/SafePreviewRenderer';

export interface GetPreviewInput {
  draftId: string;
  type: 'html' | 'json';
}

export interface GetPreviewOutput {
  type: 'html' | 'json';
  content?: string; // For HTML
  model?: any; // For JSON
  generatedAt: string;
  etag: string;
}

export class GetPreviewUseCase {
  constructor(
    private readonly draftRepository: DraftRepository,
    private readonly configGenerator: SiteConfigGenerator,
    private readonly previewRenderer: SafePreviewRenderer
  ) {}

  async execute(input: GetPreviewInput): Promise<GetPreviewOutput> {
    // Step 1: Load draft from Redis with TTL refresh (activity)
    const draftId = DraftId.fromString(input.draftId);
    const draft = await this.draftRepository.findById(draftId, true); // refreshTtl=true

    if (!draft) {
      throw new DraftNotFoundError(input.draftId);
    }

    if (draft.isExpired()) {
      throw new DraftExpiredError(input.draftId);
    }

    // Step 2: Generate SiteConfig (deterministic, no user HTML)
    const siteConfig = await this.configGenerator.generate(draft);

    // Step 3: Render preview (safe, with HTML escaping)
    const preview = await this.previewRenderer.render(siteConfig, input.type);

    // Step 4: Return preview output
    return {
      type: preview.type,
      content: preview.type === 'html' ? preview.content : undefined,
      model: preview.type === 'json' ? preview.model : undefined,
      generatedAt: preview.generatedAt,
      etag: preview.etag,
    };
  }
}
