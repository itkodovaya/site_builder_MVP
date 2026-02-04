/**
 * ProjectConfig Entity
 * Represents a stored configuration for a project
 */

import { SiteConfig } from './SiteConfig';
import crypto from 'crypto';

export type ConfigId = string; // Format: cfg_01...

export class ProjectConfig {
  constructor(
    public readonly configId: ConfigId,
    public readonly projectId: string,
    public readonly schemaVersion: number,
    public readonly configVersion: string,
    public readonly templateId: string,
    public readonly templateVersion: number,
    public readonly configJson: any, // Full SiteConfig JSON
    public readonly configHash: string, // SHA256 of configJson
    public readonly createdAt: Date
  ) {
    if (!configId || !configId.startsWith('cfg_')) {
      throw new Error('Invalid config ID format');
    }
    if (!projectId) {
      throw new Error('Project ID is required');
    }
  }

  /**
   * Generate new Config ID
   */
  static generateId(): ConfigId {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `cfg_${timestamp}${random}`;
  }

  /**
   * Create from SiteConfig
   */
  static fromSiteConfig(projectId: string, siteConfig: SiteConfig): ProjectConfig {
    const configId = ProjectConfig.generateId();
    const configJson = siteConfig.toJSON();
    const configHash = ProjectConfig.hashConfig(configJson);

    return new ProjectConfig(
      configId,
      projectId,
      configJson.schemaVersion,
      configJson.configVersion,
      configJson.generator.templateId,
      configJson.generator.templateVersion,
      configJson,
      configHash,
      new Date()
    );
  }

  /**
   * Hash config JSON for versioning/caching
   */
  static hashConfig(configJson: any): string {
    const jsonString = JSON.stringify(configJson);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
  }

  /**
   * Convert to JSON
   */
  toJSON(): any {
    return {
      configId: this.configId,
      projectId: this.projectId,
      schemaVersion: this.schemaVersion,
      configVersion: this.configVersion,
      templateId: this.templateId,
      templateVersion: this.templateVersion,
      configJson: this.configJson,
      configHash: this.configHash,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: any): ProjectConfig {
    return new ProjectConfig(
      json.configId,
      json.projectId,
      json.schemaVersion,
      json.configVersion,
      json.templateId,
      json.templateVersion,
      json.configJson,
      json.configHash,
      new Date(json.createdAt)
    );
  }
}

