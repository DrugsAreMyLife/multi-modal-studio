'use client';

import React, { useEffect } from 'react';
import { GenerationStats } from './GenerationStats';
import { UsageCharts } from './UsageCharts';
import { useAnalyticsStore } from '@/lib/store/analytics-store';
import { RefreshCw, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AnalyticsDashboard() {
  const { fetchCloudStats, isLoading } = useAnalyticsStore();

  useEffect(() => {
    fetchCloudStats();
  }, [fetchCloudStats]);

  return (
    <div className="h-full space-y-8 p-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <BarChart3 className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Usage Analytics</h2>
            <p className="text-muted-foreground text-sm">
              Monitor your AI generation activity and API costs.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchCloudStats()}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <GenerationStats />

      <UsageCharts />

      {/* Footer Info */}
      <div className="rounded-xl bg-zinc-50 p-6 dark:bg-zinc-900/50">
        <h4 className="mb-2 text-sm font-semibold">How costs are calculated</h4>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Estimated costs are based on standard pricing for each model provider at the time of
          generation. Image generations are costed per-image (e.g. DALL-E 3 HD at $0.04), and video
          generations are costed per-job (e.g. Runway Gen-3 at $0.20). Actual billing from model
          providers may vary based on your specific plan or tier.
        </p>
      </div>
    </div>
  );
}
