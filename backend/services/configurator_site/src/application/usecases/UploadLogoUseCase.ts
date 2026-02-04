/**
 * UploadLogo Use Case
 * Uploads a logo asset and updates draft with reference
 */

import { DraftRepository } from '../../domain/ports/DraftRepository';
import { AssetStorage } from '../../domain/ports/AssetStorage';
import { DraftId } from '../../domain/value-objects/DraftId';
import { DraftNotFoundError, DraftExpiredError, InvalidDraftDataError } from '../../domain/errors/DomainErrors';

export interface UploadLogoInput {
  draftId: string;
  file: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

export interface UploadLogoOutput {
  draftId: string;
  logoRef: string;
  logoUrl: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export class UploadLogoUseCase {
  constructor(
    private readonly draftRepository: DraftRepository,
    private readonly assetStorage: AssetStorage
  ) {}

  async execute(input: UploadLogoInput): Promise<UploadLogoOutput> {
    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
      throw new InvalidDraftDataError(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    // Validate file size
    if (input.size > MAX_FILE_SIZE) {
      throw new InvalidDraftDataError(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }

    const draftId = DraftId.fromString(input.draftId);
    const draft = await this.draftRepository.findById(draftId);

    if (!draft) {
      throw new DraftNotFoundError(input.draftId);
    }

    if (draft.isExpired()) {
      throw new DraftExpiredError(input.draftId);
    }

    // Upload logo to storage
    const logoRef = await this.assetStorage.store(input.file, {
      originalName: input.filename,
      mimeType: input.mimeType,
      size: input.size,
      uploadedAt: new Date(),
    });

    // Update draft with logo reference
    const updatedDraft = draft.update({ logoRef });
    await this.draftRepository.save(updatedDraft);

    // Get logo URL
    const logoUrl = await this.assetStorage.getUrl(logoRef);

    return {
      draftId: input.draftId,
      logoRef,
      logoUrl,
    };
  }
}

