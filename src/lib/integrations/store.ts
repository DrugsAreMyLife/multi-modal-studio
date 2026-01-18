import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IntegrationState {
  apiKeys: Record<string, string>; // providerId -> apiKey
  connections: Record<string, boolean>; // providerId -> isConnected

  setApiKey: (providerId: string, key: string) => void;
  connect: (providerId: string) => void;
  disconnect: (providerId: string) => void;
  isConfigured: (providerId: string) => boolean;
  getApiHeaders: () => Record<string, string>;
}

export const useIntegrationStore = create<IntegrationState>()(
  persist(
    (set, get) => ({
      apiKeys: {},
      connections: {},

      setApiKey: (providerId, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [providerId]: key },
        })),

      connect: (providerId) =>
        set((state) => ({
          connections: { ...state.connections, [providerId]: true },
        })),

      disconnect: (providerId) =>
        set((state) => ({
          connections: { ...state.connections, [providerId]: false },
        })),

      isConfigured: (providerId) => {
        const state = get();
        return !!state.apiKeys[providerId]; // Simple configuration check
      },

      getApiHeaders: () => {
        const { apiKeys } = get();
        const headers: Record<string, string> = {};
        Object.entries(apiKeys).forEach(([providerId, key]) => {
          if (key) {
            headers[`x-api-key-${providerId}`] = key;
          }
        });
        return headers;
      },
    }),
    {
      name: 'integration-store',
    },
  ),
);
