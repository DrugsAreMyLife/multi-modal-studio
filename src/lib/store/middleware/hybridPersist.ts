import { StateCreator, StoreMutatorIdentifier } from 'zustand';

interface HybridPersistConfig<T> {
  name: string;
  localStorageKey?: string;
  version?: number;
  merge?: (persistedState: unknown, currentState: T) => T;
  partialize?: (state: T) => Partial<T>;
  onRehydrateStorage?: (state: T) => ((state?: T, error?: Error) => void) | void;
}

interface SyncQueueItem {
  id: string;
  action: string;
  payload: any;
  timestamp: number;
}

// Offline sync queue stored in localStorage
const SYNC_QUEUE_KEY = 'hybrid-persist-sync-queue';

function getSyncQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(SYNC_QUEUE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function addToSyncQueue(item: SyncQueueItem): void {
  if (typeof window === 'undefined') return;
  const queue = getSyncQueue();
  queue.push(item);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

function clearSyncQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

export function hybridPersist<T extends object>(
  config: HybridPersistConfig<T>,
): (stateCreator: StateCreator<T, [], []>) => StateCreator<T, [], []> {
  const {
    name,
    localStorageKey = name,
    version = 0,
    merge = (persisted, current) => ({ ...current, ...(persisted as object) }),
    partialize = (state) => state,
  } = config;

  return (stateCreator) => (set, get, api) => {
    // Debounced persistence to avoid blocking main thread on every state change
    let persistenceTimeout: NodeJS.Timeout | null = null;
    const PERSISTENCE_DELAY = 1000;

    const persistToLocalStorage = (state: T) => {
      if (typeof window === 'undefined') return;
      if (persistenceTimeout) clearTimeout(persistenceTimeout);

      persistenceTimeout = setTimeout(() => {
        const toStore = {
          state: partialize(state),
          version,
        };
        try {
          localStorage.setItem(localStorageKey, JSON.stringify(toStore));
        } catch (e) {
          console.error(`[HybridPersist] Failed to save ${name}:`, e);
        }
      }, PERSISTENCE_DELAY);
    };

    // Wrap set to track changes
    const trackedSet: typeof set = (partial, replace?) => {
      const prevState = get();
      (set as (partial: unknown, replace?: boolean) => void)(partial, replace);
      const nextState = get();

      // Queue change for remote sync
      const queueItem: SyncQueueItem = {
        id: crypto.randomUUID(),
        action: 'state_update',
        payload: {
          storeName: name,
          changes: partialize(nextState),
          prevState: partialize(prevState),
        },
        timestamp: Date.now(),
      };

      // Persistence
      persistToLocalStorage(nextState);
      addToSyncQueue(queueItem);
    };

    // Create the store with tracked set
    const store = stateCreator(trackedSet, get, api);

    // Rehydrate from localStorage on init
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(localStorageKey);
      if (stored) {
        try {
          const { state: persistedState, version: storedVersion } = JSON.parse(stored);
          if (storedVersion === version) {
            const merged = merge(persistedState, store);
            set(merged as T, true);
          }
        } catch (e) {
          console.error(`[HybridPersist] Failed to rehydrate ${name}:`, e);
        }
      }
    }

    return store;
  };
}

// Export sync queue utilities for use with Supabase
export { getSyncQueue, clearSyncQueue, addToSyncQueue };
export type { SyncQueueItem, HybridPersistConfig };
