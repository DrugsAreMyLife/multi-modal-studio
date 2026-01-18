'use client';

import React from 'react';
import { DollarSign, Zap, ImageIcon, Video, User } from 'lucide-react';
import { useAnalyticsStore } from '@/lib/store/analytics-store';

export function GenerationStats() {
  const { cloudData } = useAnalyticsStore();
  const { summary, typeData } = cloudData;

  if (!summary) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Cost */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Total Spend</p>
            <h4 className="font-mono text-xl font-bold">${summary.totalCost.toFixed(2)}</h4>
          </div>
        </div>
      </div>

      {/* Total Generations */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Generations</p>
            <h4 className="font-mono text-xl font-bold">{summary.totalGenerations}</h4>
          </div>
        </div>
      </div>

      {/* Top Provider */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Top Provider</p>
            <h4 className="text-xl font-bold capitalize">{summary.topProvider}</h4>
          </div>
        </div>
      </div>

      {/* Image vs Video vs Audio (Mini Summary) */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex h-full items-center justify-between gap-1">
          {typeData.map((item) => (
            <div key={item.name} className="flex flex-col items-center">
              {item.name === 'image' && (
                <ImageIcon className="text-muted-foreground mb-1 h-4 w-4" />
              )}
              {item.name === 'video' && <Video className="text-muted-foreground mb-1 h-4 w-4" />}
              {/* Add sound icon for audio if needed */}
              <span className="font-mono text-xs font-medium">{item.value}</span>
              <span className="text-muted-foreground text-[10px] capitalize">{item.name}s</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
