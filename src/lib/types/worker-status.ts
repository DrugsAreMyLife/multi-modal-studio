import { WorkerId } from './job-submission';

export interface WorkerHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  modelsLoaded: string[];
  vramUsedMb: number;
  vramTotalMb: number;
  uptime: number; // seconds
  lastHealthCheck: number;
}

export interface WorkerStatus {
  workerId: WorkerId;
  name: string;
  port: number;
  health: WorkerHealthResponse | null;
  isRunning: boolean;
  pid?: number;
  startedAt?: number;
}

export interface WorkerConfig {
  workerId: WorkerId;
  name: string;
  port: number;
  script: string;
  vramEstimate: number; // MB
  healthEndpoint: string;
  dependencies?: WorkerId[];
}

export interface VramStatus {
  used: number;
  total: number;
  available: number;
  workerAllocations: Record<WorkerId, number>;
}
