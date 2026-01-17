/**
 * Model Registry Sync Service
 *
 * Automatically fetches and updates AI model listings from external registries
 * - Runs on app startup
 * - Runs periodically in background (every 20-30 minutes)
 * - Non-blocking: runs in background without interrupting user
 */

import { useImageStudioStore } from '@/lib/store/image-studio-store';
import { useVideoStudioStore } from '@/lib/store/video-studio-store';
import { useAudioStudioStore } from '@/lib/store/audio-studio-store';

// Model registry endpoints (can be external APIs or internal endpoints)
const REGISTRY_ENDPOINTS = {
  image: '/api/models/image',
  video: '/api/models/video',
  audio: '/api/models/audio',
} as const;

// Sync configuration
const SYNC_CONFIG = {
  initialDelay: 2000, // 2 seconds after app load
  minInterval: 3 * 60 * 60 * 1000, // 3 hours
  maxInterval: 4 * 60 * 60 * 1000, // 4 hours
  retryDelay: 60 * 1000, // 1 minute on error
  maxRetries: 3,
};

interface ModelSyncResult {
  success: boolean;
  modelsCount?: number;
  error?: string;
  timestamp: number;
}

class ModelRegistrySync {
  private syncIntervalId: NodeJS.Timeout | null = null;
  private lastSync: Record<string, number> = {};
  private retryCount: Record<string, number> = {};
  private isRunning = false;

  /**
   * Start the model sync service
   * Runs once immediately, then on a random schedule
   */
  start() {
    if (this.isRunning) {
      console.log('[ModelSync] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[ModelSync] Starting model registry sync service');

    // Initial sync after delay
    setTimeout(() => {
      this.syncAllModels();
    }, SYNC_CONFIG.initialDelay);

    // Schedule periodic syncs with randomized interval
    this.scheduleNextSync();
  }

  /**
   * Stop the sync service
   */
  stop() {
    if (this.syncIntervalId) {
      clearTimeout(this.syncIntervalId);
      this.syncIntervalId = null;
    }
    this.isRunning = false;
    console.log('[ModelSync] Stopped');
  }

  /**
   * Schedule next sync with randomized interval (20-30 minutes)
   */
  private scheduleNextSync() {
    const randomInterval =
      SYNC_CONFIG.minInterval + Math.random() * (SYNC_CONFIG.maxInterval - SYNC_CONFIG.minInterval);

    this.syncIntervalId = setTimeout(() => {
      this.syncAllModels();
      this.scheduleNextSync(); // Schedule next one
    }, randomInterval);

    console.log(`[ModelSync] Next sync scheduled in ${Math.round(randomInterval / 60000)} minutes`);
  }

  /**
   * Sync all model types
   */
  private async syncAllModels() {
    console.log('[ModelSync] Starting background model sync...');

    const results = await Promise.allSettled([
      this.syncImageModels(),
      this.syncVideoModels(),
      this.syncAudioModels(),
    ]);

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    console.log(`[ModelSync] Completed: ${successCount}/${results.length} registries synced`);
  }

  /**
   * Sync image models from registry
   */
  private async syncImageModels(): Promise<ModelSyncResult> {
    const type = 'image';
    try {
      console.log(`[ModelSync] Fetching ${type} models...`);

      const response = await fetch(REGISTRY_ENDPOINTS.image, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const models = data.models || [];

      // Update store (would need to add updateModels method to stores)
      console.log(`[ModelSync] Fetched ${models.length} ${type} models`);

      this.lastSync[type] = Date.now();
      this.retryCount[type] = 0;

      return {
        success: true,
        modelsCount: models.length,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`[ModelSync] Error syncing ${type} models:`, error);
      this.retryCount[type] = (this.retryCount[type] || 0) + 1;

      // Retry if under max retries
      if (this.retryCount[type] < SYNC_CONFIG.maxRetries) {
        setTimeout(() => this.syncImageModels(), SYNC_CONFIG.retryDelay);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Sync video models from registry
   */
  private async syncVideoModels(): Promise<ModelSyncResult> {
    const type = 'video';
    try {
      console.log(`[ModelSync] Fetching ${type} models...`);

      const response = await fetch(REGISTRY_ENDPOINTS.video, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const models = data.models || [];

      console.log(`[ModelSync] Fetched ${models.length} ${type} models`);

      this.lastSync[type] = Date.now();
      this.retryCount[type] = 0;

      return {
        success: true,
        modelsCount: models.length,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`[ModelSync] Error syncing ${type} models:`, error);
      this.retryCount[type] = (this.retryCount[type] || 0) + 1;

      if (this.retryCount[type] < SYNC_CONFIG.maxRetries) {
        setTimeout(() => this.syncVideoModels(), SYNC_CONFIG.retryDelay);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Sync audio models from registry
   */
  private async syncAudioModels(): Promise<ModelSyncResult> {
    const type = 'audio';
    try {
      console.log(`[ModelSync] Fetching ${type} models...`);

      const response = await fetch(REGISTRY_ENDPOINTS.audio, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const models = data.models || [];

      console.log(`[ModelSync] Fetched ${models.length} ${type} models`);

      this.lastSync[type] = Date.now();
      this.retryCount[type] = 0;

      return {
        success: true,
        modelsCount: models.length,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`[ModelSync] Error syncing ${type} models:`, error);
      this.retryCount[type] = (this.retryCount[type] || 0) + 1;

      if (this.retryCount[type] < SYNC_CONFIG.maxRetries) {
        setTimeout(() => this.syncAudioModels(), SYNC_CONFIG.retryDelay);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSync: this.lastSync,
      retryCount: this.retryCount,
    };
  }

  /**
   * Force immediate sync (for manual refresh)
   */
  async forceSyncNow() {
    console.log('[ModelSync] Force sync triggered');
    await this.syncAllModels();
  }
}

// Singleton instance
export const modelRegistrySync = new ModelRegistrySync();

// Auto-start in browser environment
if (typeof window !== 'undefined') {
  // Start on app load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      modelRegistrySync.start();
    });
  } else {
    // DOM already loaded
    modelRegistrySync.start();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    modelRegistrySync.stop();
  });
}
