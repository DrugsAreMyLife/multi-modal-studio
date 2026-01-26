'use client';

import { TrendingDown, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { LossMetrics } from '@/lib/types/training-studio';

interface LossGraphMetricsProps {
  metrics: LossMetrics;
}

/**
 * Display panel for training loss metrics
 * Shows current loss, improvement, convergence rate, and predictions
 */
export function LossGraphMetrics({ metrics }: LossGraphMetricsProps) {
  const isImproving = metrics.convergenceRate < 0;
  const improvementPercent = metrics.lossImprovement;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {/* Current Loss */}
      <Card className="p-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Current Loss</p>
            <p className="text-2xl font-bold tabular-nums">{metrics.currentLoss.toFixed(6)}</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-2">
            <BarChart3 className="text-primary h-4 w-4" />
          </div>
        </div>
      </Card>

      {/* Minimum Loss */}
      <Card className="p-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Best Loss</p>
            <p className="text-2xl font-bold tabular-nums">{metrics.minLoss.toFixed(6)}</p>
          </div>
          <div className="rounded-lg bg-green-500/10 p-2">
            <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      {/* Loss Improvement */}
      <Card className="p-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Improvement</p>
            <p className="text-2xl font-bold tabular-nums">{improvementPercent.toFixed(1)}%</p>
          </div>
          <div
            className={`rounded-lg p-2 ${
              improvementPercent > 0 ? 'bg-green-500/10' : 'bg-yellow-500/10'
            }`}
          >
            {improvementPercent > 0 ? (
              <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingUp className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            )}
          </div>
        </div>
      </Card>

      {/* Convergence Status */}
      <Card className="p-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">
              {isImproving ? 'Converging' : 'Diverging'}
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold tabular-nums">
                {Math.abs(metrics.convergenceRate).toFixed(4)}
              </p>
              <span className="text-muted-foreground text-xs">/epoch</span>
            </div>
            {metrics.estimatedConvergenceEpoch && isImproving && (
              <p className="text-muted-foreground text-xs">
                ETA: Epoch {metrics.estimatedConvergenceEpoch}
              </p>
            )}
          </div>
          <div className={`rounded-lg p-2 ${isImproving ? 'bg-blue-500/10' : 'bg-red-500/10'}`}>
            {isImproving ? (
              <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
          </div>
        </div>
      </Card>

      {/* Average Loss (spans 2 columns on desktop) */}
      <Card className="p-3 md:col-span-2">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Average Loss</p>
          <p className="text-lg font-semibold tabular-nums">{metrics.avgLoss.toFixed(6)}</p>
        </div>
      </Card>

      {/* Convergence Prediction (spans 2 columns on desktop) */}
      {metrics.estimatedConvergenceEpoch && isImproving && (
        <Card className="bg-muted/30 p-3 md:col-span-2">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Estimated Convergence</p>
            <p className="text-lg font-semibold">Epoch {metrics.estimatedConvergenceEpoch}</p>
            <p className="text-muted-foreground text-xs">Based on current convergence rate</p>
          </div>
        </Card>
      )}
    </div>
  );
}
