// Loss Graph Types
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

export interface TrainingMonitorState {
  lossHistory: LossDataPoint[];
  metrics: LossMetrics;
  graphConfig: LossGraphConfig;
  isGraphVisible: boolean;
}

export interface UseLossGraphReturn {
  lossHistory: LossDataPoint[];
  metrics: LossMetrics;
  addDataPoint: (point: Omit<LossDataPoint, 'timestamp'>) => void;
  updateMetrics: (points: LossDataPoint[]) => void;
  clearHistory: () => void;
  smoothingFactor: number;
  setSmoothingFactor: (factor: number) => void;
}
