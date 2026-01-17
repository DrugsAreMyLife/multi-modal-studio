'use client';

import { useEffect, useRef } from 'react';
import { modelRegistrySync } from '@/lib/services/model-registry-sync';

/**
 * Hook to initialize and manage model registry sync service
 * Auto-starts on mount, cleans up on unmount
 */
export function useModelSync() {
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in development mode (React StrictMode)
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    // Start the sync service
    modelRegistrySync.start();

    // Cleanup on unmount
    return () => {
      modelRegistrySync.stop();
    };
  }, []);

  return {
    /**
     * Force an immediate sync (for manual refresh button)
     */
    forceSyncNow: () => modelRegistrySync.forceSyncNow(),

    /**
     * Get current sync status
     */
    getStatus: () => modelRegistrySync.getStatus(),
  };
}
