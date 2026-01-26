import { useState, useCallback, useEffect } from 'react';
import type { LossDataPoint, LossMetrics, UseLossGraphReturn } from '../types/training-studio';
import {
  calculateBasicMetrics,
  calculateConvergenceRate,
  estimateConvergenceEpoch,
} from '../utils/loss-metrics';

/**
 * Custom hook for managing training loss graph data and metrics
 * Provides real-time loss tracking, metrics calculation, and smoothing configuration
 */
export function useLossGraph(initialSmoothingFactor: number = 0.3): UseLossGraphReturn {
  const [lossHistory, setLossHistory] = useState<LossDataPoint[]>([]);
  const [metrics, setMetrics] = useState<LossMetrics>({
    currentLoss: 0,
    minLoss: 0,
    avgLoss: 0,
    lossImprovement: 0,
    convergenceRate: 0,
  });
  const [smoothingFactor, setSmoothingFactor] = useState<number>(initialSmoothingFactor);

  /**
   * Add a new loss data point to the history
   */
  const addDataPoint = useCallback((point: Omit<LossDataPoint, 'timestamp'>) => {
    const newPoint: LossDataPoint = {
      ...point,
      timestamp: Date.now(),
    };

    setLossHistory((prev) => {
      const updated = [...prev, newPoint];
      // Keep only last 1000 points to prevent memory issues
      return updated.length > 1000 ? updated.slice(-1000) : updated;
    });
  }, []);

  /**
   * Recalculate all metrics based on current loss history
   */
  const updateMetrics = useCallback((points: LossDataPoint[]) => {
    if (points.length === 0) {
      setMetrics({
        currentLoss: 0,
        minLoss: 0,
        avgLoss: 0,
        lossImprovement: 0,
        convergenceRate: 0,
      });
      return;
    }

    const basicMetrics = calculateBasicMetrics(points);
    const convergenceRate = calculateConvergenceRate(points);
    const estimatedConvergenceEpoch = estimateConvergenceEpoch(points);

    setMetrics({
      currentLoss: basicMetrics.currentLoss || 0,
      minLoss: basicMetrics.minLoss || 0,
      avgLoss: basicMetrics.avgLoss || 0,
      lossImprovement: basicMetrics.lossImprovement || 0,
      convergenceRate,
      estimatedConvergenceEpoch,
    });
  }, []);

  /**
   * Clear all loss history and reset metrics
   */
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

  /**
   * Auto-update metrics whenever loss history changes
   */
  useEffect(() => {
    updateMetrics(lossHistory);
  }, [lossHistory, updateMetrics]);

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
