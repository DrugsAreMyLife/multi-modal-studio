'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/lib/store/chat-store';

interface SyncConfig {
  userId?: string;
  enabled?: boolean;
  debounceMs?: number;
}

export function useConversationSync(config: SyncConfig = {}) {
  const { userId, enabled = true, debounceMs = 1000 } = config;
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedRef = useRef<string>('');

  // Get chat store state and actions
  const threads = useChatStore((state) => state.threads);
  const activeThreadId = useChatStore((state) => state.activeThreadId);

  // Debounced sync to remote
  const syncToRemote = useCallback(async () => {
    if (!userId || !enabled) return;

    const currentThread = threads[activeThreadId || ''];
    if (!currentThread) return;

    const messageIds = Object.keys(currentThread.messages);
    const stateHash = JSON.stringify({
      id: activeThreadId,
      messageCount: messageIds.length,
      currentLeafId: currentThread.currentLeafId,
    });

    // Skip if nothing changed
    if (stateHash === lastSyncedRef.current) return;
    lastSyncedRef.current = stateHash;

    try {
      // Note: This will work when Supabase is properly configured
      // For now, this is a no-op since we have stub client
      console.log('[ConversationSync] Would sync thread:', activeThreadId);
    } catch (error) {
      console.error('[ConversationSync] Sync failed:', error);
    }
  }, [userId, enabled, threads, activeThreadId]);

  // Subscribe to local changes and sync
  useEffect(() => {
    if (!enabled || !userId) return;

    // Debounce sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncToRemote();
    }, debounceMs);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [threads, activeThreadId, syncToRemote, enabled, userId, debounceMs]);

  // Subscribe to remote changes (when Supabase is configured)
  useEffect(() => {
    if (!enabled || !userId) return;

    // Placeholder for Supabase realtime subscription
    // Will be activated when @supabase/supabase-js is installed
    console.log('[ConversationSync] Realtime sync ready for user:', userId);

    return () => {
      console.log('[ConversationSync] Cleanup');
    };
  }, [userId, enabled]);

  return {
    isEnabled: enabled && !!userId,
    forceSync: syncToRemote,
  };
}
