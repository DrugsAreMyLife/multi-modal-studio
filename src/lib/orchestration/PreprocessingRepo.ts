/**
 * PreprocessingRepo.ts
 * @orchestration-role "Artifact Persistence"
 * Manages the versions and metadata of preprocessed assets.
 *
 * @audit-fix Implements optimistic locking to prevent race conditions
 * @audit-fix Adds reactive subscription model for cross-modal updates
 */

import { SemanticArtifact } from './SemanticProcessor';

export interface PreprocessedAsset {
  id: string;
  originalId: string;
  version: number;
  semanticData: SemanticArtifact;
  fileUrn: string; // reference to local or cloud storage
  status: 'raw' | 'processing' | 'refined' | 'validated' | 'baked';
}

export type AssetChangeEvent = {
  type: 'register' | 'refine' | 'delete';
  asset: PreprocessedAsset;
  previousVersion?: number;
};

export type AssetSubscriber = (event: AssetChangeEvent) => void;

export class ConcurrentModificationError extends Error {
  constructor(assetId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Concurrent modification detected for asset ${assetId}: expected v${expectedVersion}, found v${actualVersion}`,
    );
    this.name = 'ConcurrentModificationError';
  }
}

export class PreprocessingRepo {
  private static assets: Map<string, PreprocessedAsset> = new Map();
  private static subscribers: Set<AssetSubscriber> = new Set();
  private static operationLock: Promise<void> = Promise.resolve();
  private static readonly MAX_ASSETS = 1000; // Unbounded Map prevention audit fix

  /**
   * Subscribe to asset change events for reactive updates.
   * Returns unsubscribe function.
   */
  static subscribe(callback: AssetSubscriber): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private static notify(event: AssetChangeEvent): void {
    this.subscribers.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('[PreprocessingRepo] Subscriber error:', err);
      }
    });
  }

  /**
   * Acquire lock for atomic operations.
   */
  private static async acquireLock<T>(operation: () => T): Promise<T> {
    let release: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      release = resolve;
    });

    const previousLock = this.operationLock;
    this.operationLock = lockPromise;

    await previousLock;
    try {
      return operation();
    } finally {
      release!();
    }
  }

  static registerAsset(asset: PreprocessedAsset): void {
    // Synchronous registration with notification
    const existing = this.assets.get(asset.id);
    if (existing) {
      console.warn(`[PreprocessingRepo] Overwriting existing asset: ${asset.id}`);
    }

    // Memory Management: Prune oldest assets if capacity reached
    if (this.assets.size >= this.MAX_ASSETS) {
      const firstKey = this.assets.keys().next().value;
      if (firstKey) this.assets.delete(firstKey);
    }

    this.assets.set(asset.id, asset);
    console.log(`[PreprocessingRepo] Registered asset: ${asset.id} (v${asset.version})`);
    this.notify({ type: 'register', asset });
  }

  static getAsset(id: string): PreprocessedAsset | undefined {
    return this.assets.get(id);
  }

  static getHistoryByOriginalId(originalId: string): PreprocessedAsset[] {
    return Array.from(this.assets.values())
      .filter((a) => a.originalId === originalId)
      .sort((a, b) => b.version - a.version);
  }

  /**
   * Refines an asset by applying semantic updates with optimistic locking.
   * @param id - Asset ID to refine
   * @param updates - Partial updates to apply
   * @param expectedVersion - Optional version check for optimistic locking
   * @throws ConcurrentModificationError if version mismatch detected
   */
  static refineAsset(
    id: string,
    updates: Partial<PreprocessedAsset>,
    expectedVersion?: number,
  ): PreprocessedAsset {
    const existing = this.assets.get(id);
    if (!existing) {
      throw new Error(`Asset not found: ${id}`);
    }

    // Optimistic locking: verify version hasn't changed
    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      throw new ConcurrentModificationError(id, expectedVersion, existing.version);
    }

    const previousVersion = existing.version;
    const updated: PreprocessedAsset = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      // Preserve id - never allow updates to change it
      id: existing.id,
    };

    this.assets.set(id, updated);
    console.log(
      `[PreprocessingRepo] Refined asset: ${id} (v${previousVersion} -> v${updated.version})`,
    );
    this.notify({ type: 'refine', asset: updated, previousVersion });

    return updated;
  }

  /**
   * Async version of refineAsset with lock acquisition for guaranteed atomicity.
   */
  static async refineAssetAsync(
    id: string,
    updates: Partial<PreprocessedAsset>,
  ): Promise<PreprocessedAsset> {
    return this.acquireLock(() => {
      const existing = this.assets.get(id);
      if (!existing) {
        throw new Error(`Asset not found: ${id}`);
      }
      return this.refineAsset(id, updates, existing.version);
    });
  }

  /**
   * Get all assets matching a source type for cross-modal queries.
   */
  static getAssetsBySource(source: SemanticArtifact['source']): PreprocessedAsset[] {
    return Array.from(this.assets.values()).filter((a) => a.semanticData.source === source);
  }

  /**
   * Clear all assets (for testing/reset purposes).
   */
  static clear(): void {
    this.assets.clear();
    console.log('[PreprocessingRepo] Cleared all assets');
  }
}
