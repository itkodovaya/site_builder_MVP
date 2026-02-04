/**
 * Cleanup Expired Drafts Job
 * Background job to cleanup expired drafts (only needed if using DB storage)
 * 
 * Note: When using Redis with TTL, this job is not needed as Redis handles expiration automatically
 */

import { DraftRepository } from '../domain/ports/DraftRepository';

export class CleanupExpiredDraftsJob {
  constructor(
    private readonly draftRepository: DraftRepository,
    private readonly intervalMs: number = 60 * 60 * 1000 // 1 hour
  ) {}

  start(): NodeJS.Timeout {
    console.log('Starting cleanup expired drafts job...');
    
    return setInterval(async () => {
      try {
        await this.execute();
      } catch (error) {
        console.error('Error in cleanup job:', error);
      }
    }, this.intervalMs);
  }

  async execute(): Promise<void> {
    console.log('Running cleanup expired drafts job...');
    
    // Note: This is primarily for DB-based storage
    // Redis with TTL handles this automatically
    
    // If using DB, implement cleanup logic here:
    // 1. Find all drafts where expiresAt < NOW()
    // 2. Delete them from the database
    // 3. Delete associated assets if needed
    
    console.log('Cleanup job completed');
  }

  stop(timer: NodeJS.Timeout): void {
    clearInterval(timer);
    console.log('Cleanup job stopped');
  }
}

