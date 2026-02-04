/**
 * S3 Asset Storage
 * S3-compatible storage adapter for assets (MinIO/AWS S3)
 */

import { Client as MinioClient } from 'minio';
import { v4 as uuidv4 } from 'uuid';
import { AssetStorage, AssetMetadata } from '../../domain/ports/AssetStorage';

export interface S3Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region?: string;
  useSSL?: boolean;
}

export class S3AssetStorage implements AssetStorage {
  private client: MinioClient;
  private bucket: string;
  private publicBaseUrl: string;

  constructor(config: S3Config) {
    // Parse endpoint to extract host and port
    const endpointUrl = new URL(config.endpoint);
    
    this.client = new MinioClient({
      endPoint: endpointUrl.hostname,
      port: endpointUrl.port ? parseInt(endpointUrl.port) : (config.useSSL ? 443 : 80),
      useSSL: config.useSSL ?? endpointUrl.protocol === 'https:',
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
    });

    this.bucket = config.bucket;
    this.publicBaseUrl = config.endpoint;

    // Don't block initialization - check bucket asynchronously
    this.ensureBucketExists().catch((err) => {
      console.warn('S3 bucket check failed (will retry on first use):', err.message);
    });
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        console.log(`Bucket ${this.bucket} created successfully`);
      }
    } catch (error: any) {
      console.warn('Failed to ensure bucket exists:', error.message);
      // Don't throw - allow service to start without S3
    }
  }

  async store(buffer: Buffer, metadata: AssetMetadata): Promise<string> {
    // Generate unique file reference
    const extension = this.getFileExtension(metadata.originalName);
    const ref = `logos/${uuidv4()}${extension}`;

    // Upload to S3
    await this.client.putObject(
      this.bucket,
      ref,
      buffer,
      buffer.length,
      {
        'Content-Type': metadata.mimeType,
        'x-amz-meta-original-name': metadata.originalName,
        'x-amz-meta-uploaded-at': metadata.uploadedAt.toISOString(),
      }
    );

    return ref;
  }

  async getUrl(ref: string): Promise<string> {
    // For public buckets, construct direct URL
    // For private buckets, generate presigned URL
    try {
      // Generate presigned URL valid for 7 days
      const url = await this.client.presignedGetObject(this.bucket, ref, 7 * 24 * 60 * 60);
      return url;
    } catch (error) {
      // Fallback to direct URL if presigned fails
      return `${this.publicBaseUrl}/${this.bucket}/${ref}`;
    }
  }

  async exists(ref: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, ref);
      return true;
    } catch (error) {
      return false;
    }
  }

  async delete(ref: string): Promise<void> {
    await this.client.removeObject(this.bucket, ref);
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot >= 0 ? filename.substring(lastDot) : '';
  }
}

