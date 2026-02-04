/**
 * Data Transfer Objects for draft operations
 */

export interface CreateDraftDTO {
  brandName: string;
  industry: {
    category: string;
    subcategory: string;
    tags?: string[];
  };
  logoAssetId: string;
  theme?: {
    templateId?: 'default' | 'minimal' | 'modern';
    style?: 'light' | 'dark' | 'auto';
  };
  metadata?: {
    createdFrom?: 'web' | 'api' | 'mobile';
    ipAddress?: string;
    sessionId?: string;
  };
}

export interface UpdateDraftDTO {
  brandName?: string;
  industry?: {
    category: string;
    subcategory: string;
    tags?: string[];
  };
  theme?: {
    templateId?: 'default' | 'minimal' | 'modern';
    style?: 'light' | 'dark' | 'auto';
  };
  pages?: any[];
}

export interface CommitDraftDTO {
  userId: string;
  metadata?: {
    registrationSource?: string;
    registeredAt?: string;
  };
}

export interface DraftResponseDTO {
  draftId: string;
  previewUrl: string;
  config: any;
  status: string;
  ttl: {
    createdAt: string;
    expiresAt: string;
    remainingSeconds: number;
  };
}

export interface CommitResponseDTO {
  siteId: string;
  draftId: string;
  userId: string;
  config: any;
  migratedAt: string;
  editUrl: string;
}
