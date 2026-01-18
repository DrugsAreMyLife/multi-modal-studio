import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ApiUsageEntry {
  id: string;
  provider: string;
  model: string;
  endpoint: string;
  tokensIn: number;
  tokensOut: number;
  costCents: number;
  timestamp: number;
  success: boolean;
}

export interface AnalyticsSummary {
  totalCost: number;
  totalGenerations: number;
  topProvider: string;
}

export interface ChartData {
  date: string;
  cost: number;
  count: number;
}

interface AnalyticsState {
  usage: ApiUsageEntry[];
  dailyBudgetCents: number;
  monthlyBudgetCents: number;
  isLoading: boolean;
  error: string | null;
  cloudData: {
    summary: AnalyticsSummary | null;
    dailyData: ChartData[];
    providerData: any[];
    typeData: any[];
  };

  // Actions
  trackUsage: (entry: Omit<ApiUsageEntry, 'id' | 'timestamp'>) => void;
  fetchCloudStats: () => Promise<void>;
  setDailyBudget: (cents: number) => void;
  setMonthlyBudget: (cents: number) => void;
  clearHistory: () => void;

  // Computed
  getTodayUsage: () => ApiUsageEntry[];
  getThisMonthUsage: () => ApiUsageEntry[];
  getTodayCost: () => number;
  getMonthCost: () => number;
  getUsageByProvider: () => Record<string, { count: number; cost: number }>;
  isOverDailyBudget: () => boolean;
  isOverMonthlyBudget: () => boolean;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      usage: [],
      dailyBudgetCents: 500, // $5 default daily
      monthlyBudgetCents: 10000, // $100 default monthly
      isLoading: false,
      error: null,
      cloudData: {
        summary: null,
        dailyData: [],
        providerData: [],
        typeData: [],
      },

      trackUsage: (entry) => {
        set((state) => ({
          usage: [
            ...state.usage,
            {
              ...entry,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
            },
          ].slice(-1000), // Keep last 1000 entries
        }));
      },

      fetchCloudStats: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/analytics');
          if (!response.ok) throw new Error('Failed to fetch analytics');
          const data = await response.json();
          set({ cloudData: data, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      setDailyBudget: (cents) => set({ dailyBudgetCents: cents }),
      setMonthlyBudget: (cents) => set({ monthlyBudgetCents: cents }),
      clearHistory: () => set({ usage: [] }),

      getTodayUsage: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return get().usage.filter((e: ApiUsageEntry) => e.timestamp >= today.getTime());
      },

      getThisMonthUsage: () => {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        return get().usage.filter((e: ApiUsageEntry) => e.timestamp >= monthStart.getTime());
      },

      getTodayCost: () => {
        return get()
          .getTodayUsage()
          .reduce((sum: number, e: ApiUsageEntry) => sum + e.costCents, 0);
      },

      getMonthCost: () => {
        return get()
          .getThisMonthUsage()
          .reduce((sum: number, e: ApiUsageEntry) => sum + e.costCents, 0);
      },

      getUsageByProvider: () => {
        const byProvider: Record<string, { count: number; cost: number }> = {};
        get().usage.forEach((e: ApiUsageEntry) => {
          if (!byProvider[e.provider]) {
            byProvider[e.provider] = { count: 0, cost: 0 };
          }
          byProvider[e.provider].count++;
          byProvider[e.provider].cost += e.costCents;
        });
        return byProvider;
      },

      isOverDailyBudget: () => get().getTodayCost() >= get().dailyBudgetCents,
      isOverMonthlyBudget: () => get().getMonthCost() >= get().monthlyBudgetCents,
    }),
    { name: 'analytics-storage', version: 1 },
  ),
);
