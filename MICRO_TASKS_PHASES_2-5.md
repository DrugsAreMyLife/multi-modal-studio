# Micro-Task Decomposition: Phases 2-5

## Ultra-Granular Tasks for Haiku 4.5 Parallel Execution

---

# PHASE 2: Loss Graph Visualization (8 tasks → 22 micro-tasks)

## Overview

Interactive loss graph component with real-time updates, metrics calculation, and integration into TrainingMonitor.

**Original Duration**: 8 subtasks
**Decomposed into**: 22 micro-tasks (5-10 minutes each)
**Total Sequential Time**: ~4.5 hours
**Estimated Parallel Time**: ~35 minutes
**Parallelization Factor**: 8x

---

## Wave 1: Type Definitions & Interfaces (Parallel Safe)

### 2.1.1: Create LossMetrics Interface

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/training-studio.ts` (NEW)
**Duration**: 6 min
**Dependencies**: None
**Parallel Group**: types

Create file with:

```typescript
export interface LossDataPoint {
  epoch: number;
  iteration: number;
  loss: number;
  timestamp: number;
  metrics?: Record<string, number>;
}

export interface LossMetrics {
  currentLoss: number;
  minLoss: number;
  avgLoss: number;
  lossImprovement: number; // percentage
  convergenceRate: number; // slope
  estimatedConvergenceEpoch?: number;
}

export interface LossGraphConfig {
  smoothingFactor: number; // 0-1 for EMA
  showMovingAverage: boolean;
  metricsToDisplay: string[];
  yAxisScale: 'linear' | 'log';
}
```

**Success Criteria**: File created, types compile, no circular imports.

---

### 2.1.2: Create TrainingMonitorState Extension

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/training-studio.ts`
**Duration**: 5 min
**Dependencies**: 2.1.1
**Parallel Group**: types

Add to file:

```typescript
export interface TrainingMonitorState {
  lossHistory: LossDataPoint[];
  metrics: LossMetrics;
  graphConfig: LossGraphConfig;
  isGraphVisible: boolean;
}
```

**Success Criteria**: Interface extends properly, no naming conflicts.

---

### 2.1.3: Create LossGraphHook Types

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/training-studio.ts`
**Duration**: 5 min
**Dependencies**: 2.1.1, 2.1.2
**Parallel Group**: types

Add:

```typescript
export interface UseLossGraphReturn {
  lossHistory: LossDataPoint[];
  metrics: LossMetrics;
  addDataPoint: (point: Omit<LossDataPoint, 'timestamp'>) => void;
  updateMetrics: (points: LossDataPoint[]) => void;
  clearHistory: () => void;
  smoothingFactor: number;
  setSmoothingFactor: (factor: number) => void;
}
```

**Success Criteria**: All types properly exported, usable in hooks.

---

## Wave 2: Metrics Calculation Utilities (Parallel Safe)

### 2.2.1: Create calculateBasicMetrics Function

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/utils/loss-metrics.ts` (NEW)
**Duration**: 8 min
**Dependencies**: 2.1.1
**Parallel Group**: utils

```typescript
export function calculateBasicMetrics(points: LossDataPoint[]): Partial<LossMetrics> {
  if (points.length === 0) return {};

  const losses = points.map((p) => p.loss);
  const minLoss = Math.min(...losses);
  const maxLoss = Math.max(...losses);
  const currentLoss = points[points.length - 1].loss;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
  const improvement = ((maxLoss - currentLoss) / maxLoss) * 100;

  return {
    currentLoss,
    minLoss,
    avgLoss,
    lossImprovement: improvement,
  };
}
```

**Success Criteria**: Function handles empty arrays, returns correct calculations.

---

### 2.2.2: Create calculateConvergenceRate Function

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/utils/loss-metrics.ts`
**Duration**: 8 min
**Dependencies**: 2.1.1
**Parallel Group**: utils

```typescript
export function calculateConvergenceRate(points: LossDataPoint[]): number {
  if (points.length < 2) return 0;

  const recent = points.slice(-10); // Last 10 points
  const x = recent.map((_, i) => i);
  const y = recent.map((p) => p.loss);

  // Linear regression slope
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope; // Negative = converging
}
```

**Success Criteria**: Returns realistic slope values, handles edge cases.

---

### 2.2.3: Create exponentialMovingAverage Function

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/utils/loss-metrics.ts`
**Duration**: 6 min
**Dependencies**: 2.1.1
**Parallel Group**: utils

```typescript
export function exponentialMovingAverage(points: LossDataPoint[], factor: number): number[] {
  if (points.length === 0) return [];

  const ema = [points[0].loss];
  for (let i = 1; i < points.length; i++) {
    const prev = ema[i - 1];
    const current = points[i].loss;
    ema.push(factor * current + (1 - factor) * prev);
  }

  return ema;
}
```

**Success Criteria**: Produces smooth curve, handles boundary conditions.

---

### 2.2.4: Create estimateConvergenceEpoch Function

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/utils/loss-metrics.ts`
**Duration**: 7 min
**Dependencies**: 2.2.2
**Parallel Group**: utils

```typescript
export function estimateConvergenceEpoch(
  points: LossDataPoint[],
  targetLoss: number = 0.01,
): number | undefined {
  if (points.length < 2) return undefined;

  const rate = calculateConvergenceRate(points);
  if (rate >= 0) return undefined; // Not converging

  const currentLoss = points[points.length - 1].loss;
  const currentEpoch = points[points.length - 1].epoch;

  const epochsToTarget = (currentLoss - targetLoss) / Math.abs(rate);
  return currentEpoch + Math.ceil(epochsToTarget);
}
```

**Success Criteria**: Returns realistic estimates, handles non-converging cases.

---

## Wave 3: Custom Hook Implementation (Depends on Wave 2)

### 2.3.1: Create useLossGraph Hook

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/hooks/useLossGraph.ts` (NEW)
**Duration**: 10 min
**Dependencies**: 2.1.3, 2.2.1-2.2.4
**Parallel Group**: hooks

```typescript
'use client';

import { useState, useCallback } from 'react';
import { LossDataPoint, LossMetrics, UseLossGraphReturn } from '@/lib/types/training-studio';
import {
  calculateBasicMetrics,
  calculateConvergenceRate,
  exponentialMovingAverage,
  estimateConvergenceEpoch,
} from '@/lib/utils/loss-metrics';

export function useLossGraph(initialData: LossDataPoint[] = []): UseLossGraphReturn {
  const [lossHistory, setLossHistory] = useState<LossDataPoint[]>(initialData);
  const [smoothingFactor, setSmoothingFactor] = useState(0.7);
  const [metrics, setMetrics] = useState<LossMetrics>(calculateMetricsFromData(initialData));

  const calculateMetricsFromData = (points: LossDataPoint[]): LossMetrics => {
    const basic = calculateBasicMetrics(points);
    const convergenceRate = calculateConvergenceRate(points);
    const estimatedEpoch = estimateConvergenceEpoch(points);

    return {
      currentLoss: basic.currentLoss || 0,
      minLoss: basic.minLoss || 0,
      avgLoss: basic.avgLoss || 0,
      lossImprovement: basic.lossImprovement || 0,
      convergenceRate,
      estimatedConvergenceEpoch: estimatedEpoch,
    };
  };

  const updateMetrics = useCallback((points: LossDataPoint[]) => {
    setMetrics(calculateMetricsFromData(points));
  }, []);

  const addDataPoint = useCallback(
    (point: Omit<LossDataPoint, 'timestamp'>) => {
      const newPoint: LossDataPoint = {
        ...point,
        timestamp: Date.now(),
      };
      setLossHistory((prev) => [...prev, newPoint]);
      updateMetrics([...lossHistory, newPoint]);
    },
    [lossHistory, updateMetrics],
  );

  const clearHistory = useCallback(() => {
    setLossHistory([]);
    setMetrics({
      currentLoss: 0,
      minLoss: 0,
      avgLoss: 0,
      lossImprovement: 0,
      convergenceRate: 0,
    });
  }, []);

  return {
    lossHistory,
    metrics,
    addDataPoint,
    updateMetrics,
    clearHistory,
    smoothingFactor,
    setSmoothingFactor,
  };
}
```

**Success Criteria**: Hook properly initialized, callbacks don't cause stale closures.

---

## Wave 4: LossGraph Component (Depends on Wave 3)

### 2.4.1: Create LossGraph Component Structure

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/training/LossGraph.tsx` (NEW)
**Duration**: 10 min
**Dependencies**: 2.3.1
**Parallel Group**: components

```typescript
'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { LossDataPoint, LossMetrics } from '@/lib/types/training-studio';
import { exponentialMovingAverage } from '@/lib/utils/loss-metrics';

interface LossGraphProps {
  data: LossDataPoint[];
  metrics: LossMetrics;
  smoothingFactor: number;
  height?: number;
  showMovingAverage?: boolean;
  yAxisScale?: 'linear' | 'log';
}

export function LossGraph({
  data,
  metrics,
  smoothingFactor,
  height = 300,
  showMovingAverage = true,
  yAxisScale = 'linear',
}: LossGraphProps) {
  const smoothedData = useMemo(() => {
    if (!showMovingAverage || data.length === 0) return null;

    const ema = exponentialMovingAverage(data, smoothingFactor);
    return data.map((point, idx) => ({
      ...point,
      smoothedLoss: ema[idx],
    }));
  }, [data, smoothingFactor, showMovingAverage]);

  const chartData = smoothedData || data;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="epoch" />
          <YAxis scale={yAxisScale} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-background border rounded p-2 text-xs">
                    <p>Epoch: {data.epoch}</p>
                    <p>Loss: {data.loss.toFixed(6)}</p>
                    {data.smoothedLoss && <p>EMA: {data.smoothedLoss.toFixed(6)}</p>}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="loss"
            stroke="#8884d8"
            dot={false}
            name="Loss"
            strokeWidth={1.5}
          />
          {showMovingAverage && (
            <Line
              type="monotone"
              dataKey="smoothedLoss"
              stroke="#82ca9d"
              dot={false}
              name="EMA"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Success Criteria**: Component renders without errors, chart displays data correctly.

---

### 2.4.2: Create LossMetricsDisplay Component

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/training/LossMetricsDisplay.tsx` (NEW)
**Duration**: 8 min
**Dependencies**: 2.1.2
**Parallel Group**: components

```typescript
'use client';

import { Card } from '@/components/ui/card';
import { LossMetrics } from '@/lib/types/training-studio';
import { TrendingDown, Zap, Target } from 'lucide-react';

interface LossMetricsDisplayProps {
  metrics: LossMetrics;
}

export function LossMetricsDisplay({ metrics }: LossMetricsDisplayProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-yellow-500" />
          <div>
            <p className="text-xs text-muted-foreground">Current Loss</p>
            <p className="text-sm font-mono font-bold">{metrics.currentLoss.toFixed(6)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center gap-2">
          <TrendingDown size={14} className="text-green-500" />
          <div>
            <p className="text-xs text-muted-foreground">Min Loss</p>
            <p className="text-sm font-mono font-bold">{metrics.minLoss.toFixed(6)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-3">
        <div>
          <p className="text-xs text-muted-foreground">Improvement</p>
          <p className="text-sm font-mono font-bold text-green-600">
            {metrics.lossImprovement.toFixed(2)}%
          </p>
        </div>
      </Card>

      <Card className="p-3">
        <div>
          <p className="text-xs text-muted-foreground">Est. Convergence</p>
          <p className="text-sm font-mono font-bold">
            {metrics.estimatedConvergenceEpoch
              ? `Epoch ${metrics.estimatedConvergenceEpoch}`
              : 'N/A'}
          </p>
        </div>
      </Card>
    </div>
  );
}
```

**Success Criteria**: Cards render correctly, metrics display with proper formatting.

---

## Wave 5: Controls & Configuration (Depends on Wave 4)

### 2.5.1: Create LossGraphControls Component

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/training/LossGraphControls.tsx` (NEW)
**Duration**: 9 min
**Dependencies**: 2.1.3
**Parallel Group**: components

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

interface LossGraphControlsProps {
  smoothingFactor: number;
  onSmoothingChange: (factor: number) => void;
  showMovingAverage: boolean;
  onShowMovingAverageChange: (show: boolean) => void;
  yAxisScale: 'linear' | 'log';
  onYAxisScaleChange: (scale: 'linear' | 'log') => void;
  onClearHistory: () => void;
}

export function LossGraphControls({
  smoothingFactor,
  onSmoothingChange,
  showMovingAverage,
  onShowMovingAverageChange,
  yAxisScale,
  onYAxisScaleChange,
  onClearHistory,
}: LossGraphControlsProps) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-muted/30 rounded-lg">
      <div>
        <Label className="text-xs">Smoothing Factor: {smoothingFactor.toFixed(2)}</Label>
        <Slider
          value={[smoothingFactor]}
          onValueChange={([v]) => onSmoothingChange(v)}
          min={0.1}
          max={0.99}
          step={0.05}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={showMovingAverage}
          onCheckedChange={(checked) => onShowMovingAverageChange(checked as boolean)}
        />
        <Label className="text-xs cursor-pointer">Show Moving Average</Label>
      </div>

      <div>
        <Label className="text-xs mb-2 block">Y-Axis Scale</Label>
        <Select value={yAxisScale} onValueChange={onYAxisScaleChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="log">Logarithmic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onClearHistory}
        className="w-full gap-2"
      >
        <Trash2 size={14} />
        Clear History
      </Button>
    </div>
  );
}
```

**Success Criteria**: All controls functional, state changes propagate correctly.

---

## Wave 6: Integration & Testing (Depends on Waves 4-5)

### 2.6.1: Create LossGraphContainer Wrapper Component

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/training/LossGraphContainer.tsx` (NEW)
**Duration**: 10 min
**Dependencies**: 2.3.1, 2.4.1, 2.4.2, 2.5.1
**Parallel Group**: integration

```typescript
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useLossGraph } from '@/lib/hooks/useLossGraph';
import { LossGraph } from './LossGraph';
import { LossMetricsDisplay } from './LossMetricsDisplay';
import { LossGraphControls } from './LossGraphControls';
import { LossDataPoint } from '@/lib/types/training-studio';

interface LossGraphContainerProps {
  initialData?: LossDataPoint[];
  onDataUpdate?: (data: LossDataPoint[]) => void;
  height?: number;
}

export function LossGraphContainer({
  initialData,
  onDataUpdate,
  height = 400,
}: LossGraphContainerProps) {
  const {
    lossHistory,
    metrics,
    addDataPoint,
    clearHistory,
    smoothingFactor,
    setSmoothingFactor,
  } = useLossGraph(initialData);

  const [showMovingAverage, setShowMovingAverage] = useState(true);
  const [yAxisScale, setYAxisScale] = useState<'linear' | 'log'>('linear');

  const handleClearHistory = () => {
    clearHistory();
    onDataUpdate?.([]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold mb-3">Loss Metrics</h3>
        <LossMetricsDisplay metrics={metrics} />
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Loss Curve</h3>
        <LossGraph
          data={lossHistory}
          metrics={metrics}
          smoothingFactor={smoothingFactor}
          height={height}
          showMovingAverage={showMovingAverage}
          yAxisScale={yAxisScale}
        />
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Controls</h3>
        <LossGraphControls
          smoothingFactor={smoothingFactor}
          onSmoothingChange={setSmoothingFactor}
          showMovingAverage={showMovingAverage}
          onShowMovingAverageChange={setShowMovingAverage}
          yAxisScale={yAxisScale}
          onYAxisScaleChange={setYAxisScale}
          onClearHistory={handleClearHistory}
        />
      </Card>
    </div>
  );
}

export { useLossGraph };
export type { UseLossGraphReturn } from '@/lib/hooks/useLossGraph';
```

**Success Criteria**: Container integrates all subcomponents, data flows correctly.

---

### 2.6.2: Integration Test - Add to TrainingMonitor

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workbench/TrainingMonitor.tsx`
**Duration**: 8 min
**Dependencies**: 2.6.1
**Parallel Group**: integration

**Action**: Add LossGraphContainer import and render it:

```typescript
import { LossGraphContainer } from '@/components/training/LossGraphContainer';

// In TrainingMonitor render:
<LossGraphContainer
  initialData={trainingData?.losses}
  height={400}
/>
```

**Success Criteria**: Component renders without console errors, data displays correctly.

---

## Parallelization Plan

**Wave 1** (Types): 3 tasks → 6 min
**Wave 2** (Utils): 4 tasks → 8 min (parallel, all independent)
**Wave 3** (Hook): 1 task → 10 min (depends on Wave 2)
**Wave 4** (Components): 2 tasks → 10 min (depends on Wave 3)
**Wave 5** (Controls): 1 task → 9 min (depends on Wave 4)
**Wave 6** (Integration): 2 tasks → 10 min (depends on Wave 5)

**Total Parallel Time**: ~35 minutes
**Estimated Sequential Time**: ~4.5 hours

---
