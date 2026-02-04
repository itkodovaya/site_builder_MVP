/**
 * Project Entity
 * Represents a permanent project (migrated from temporary draft)
 */

import { DraftId } from '../value-objects/DraftId';

export type ProjectId = string; // Format: prj_01...
export type UserId = string; // Opaque external user ID
export type TenantId = string; // Opaque tenant ID

export type ProjectStatus = 'DRAFT' | 'READY' | 'PUBLISHED' | 'ARCHIVED';

export interface ProjectOwner {
  userId: UserId;
  tenantId?: TenantId;
}

export class Project {
  constructor(
    public readonly projectId: ProjectId,
    public readonly owner: ProjectOwner,
    public readonly draftId: DraftId,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly status: ProjectStatus
  ) {
    if (!projectId || !projectId.startsWith('prj_')) {
      throw new Error('Invalid project ID format');
    }
    if (!owner.userId) {
      throw new Error('Owner user ID is required');
    }
  }

  /**
   * Generate new Project ID
   */
  static generateId(): ProjectId {
    // Use ULID or similar for sortable, unique IDs
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `prj_${timestamp}${random}`;
  }

  /**
   * Create new project from draft
   */
  static fromDraft(draftId: DraftId, owner: ProjectOwner): Project {
    const now = new Date();
    return new Project(
      Project.generateId(),
      owner,
      draftId,
      now,
      now,
      'DRAFT' // Start as permanent draft
    );
  }

  /**
   * Convert to JSON
   */
  toJSON(): any {
    return {
      projectId: this.projectId,
      owner: this.owner,
      draftId: this.draftId.toString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      status: this.status,
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: any): Project {
    return new Project(
      json.projectId,
      json.owner,
      DraftId.fromString(json.draftId),
      new Date(json.createdAt),
      new Date(json.updatedAt),
      json.status
    );
  }
}

