import type { LossDataPoint, LossMetrics } from '@/lib/types/training-studio';

export function calculateBasicMetrics(points: LossDataPoint[]): Partial<LossMetrics> {
  if (points.length === 0) return {};

  const losses = points.map((p) => p.loss);
  const minLoss = Math.min(...losses);
  const maxLoss = Math.max(...losses);
  const currentLoss = points[points.length - 1].loss;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
  const improvement = maxLoss > 0 ? ((maxLoss - currentLoss) / maxLoss) * 100 : 0;

  return {
    currentLoss,
    minLoss,
    avgLoss,
    lossImprovement: improvement,
  };
}

export function calculateConvergenceRate(points: LossDataPoint[]): number {
  if (points.length < 2) return 0;

  // Use last 10 points for convergence rate calculation
  const recent = points.slice(-10);
  const x = recent.map((_, i) => i);
  const y = recent.map((p) => p.loss);

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  return slope; // Negative = converging
}

export function exponentialMovingAverage(points: LossDataPoint[], factor: number): number[] {
  if (points.length === 0) return [];

  // Clamp factor to valid range [0, 1]
  const clampedFactor = Math.max(0, Math.min(1, factor));
  const ema: number[] = [points[0].loss];

  for (let i = 1; i < points.length; i++) {
    const prev = ema[i - 1];
    const current = points[i].loss;
    ema.push(clampedFactor * current + (1 - clampedFactor) * prev);
  }

  return ema;
}

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
