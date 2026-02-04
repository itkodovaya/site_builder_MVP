/**
 * Draft API DTOs
 * Request and response data transfer objects
 */

import { z } from 'zod';

// Industry schema
const industrySchema = z.object({
  code: z.enum(['tech', 'finance', 'healthcare', 'retail', 'education', 'real-estate', 'consulting', 'restaurant', 'other']),
  label: z.string().optional(), // Will be auto-generated if not provided
});

// Logo reference schema
const logoRefSchema = z.object({
  assetId: z.string().uuid(),
});

// Create draft request
export const createDraftRequestSchema = z.object({
  brandName: z.string().min(1).max(100),
  industry: industrySchema,
  logo: logoRefSchema.optional(),
});

export const CreateDraftRequestSchema = createDraftRequestSchema; // Alias for compatibility
export type CreateDraftRequest = z.infer<typeof createDraftRequestSchema>;

// Update draft request (all fields optional for partial updates)
export const updateDraftRequestSchema = z.object({
  brandName: z.string().min(1).max(100).optional(),
  industry: industrySchema.optional(),
  logo: logoRefSchema.optional().nullable(), // null = remove logo
});

export const UpdateDraftRequestSchema = updateDraftRequestSchema; // Alias for compatibility
export type UpdateDraftRequest = z.infer<typeof updateDraftRequestSchema>;

// Draft response (common structure)
export interface DraftResponse {
  draftId: string;
  status: 'DRAFT';
  createdAt?: string;
  updatedAt?: string;
  expiresAt: string;
  brandProfile: {
    brandName: string;
    industry: {
      code: string;
      label: string;
    };
    logo?: {
      assetId: string;
      url?: string;
    };
  };
}

// Preview response
export interface PreviewResponse {
  draftId: string;
  preview: {
    type: 'html' | 'json';
    content?: string; // For HTML
    model?: any; // For JSON preview model
    generatedAt: string;
  };
}

// Error response
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
}

// Draft ID parameter
export const draftIdParamSchema = z.object({
  draft_id: z.string().uuid(),
});

export type DraftIdParam = z.infer<typeof draftIdParamSchema>;

// Preview query parameters
export const previewQuerySchema = z.object({
  type: z.enum(['html', 'json']).default('html'),
});

export type PreviewQuery = z.infer<typeof previewQuerySchema>;
