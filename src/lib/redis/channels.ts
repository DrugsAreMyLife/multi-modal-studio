// Redis channel naming conventions for job queue system

export const REDIS_CHANNELS = {
  // Job result channels - subscribe to get results
  jobResult: (jobId: string) => `job-results:${jobId}`,
  jobProgress: (jobId: string) => `job-progress:${jobId}`,

  // Worker status channels
  workerHealth: (workerId: string) => `worker-health:${workerId}`,
  workerStatus: (workerId: string) => `worker-status:${workerId}`,

  // Queue names
  BATCH_GENERATION_QUEUE: 'batch-generation-queue',
  NOTIFICATION_QUEUE: 'user-notification-queue',

  // Broadcast channels
  SYSTEM_STATUS: 'system-status',
  VRAM_UPDATES: 'vram-updates',
} as const;

export const REDIS_KEYS = {
  // Job data storage
  jobData: (jobId: string) => `job:${jobId}:data`,
  jobStatus: (jobId: string) => `job:${jobId}:status`,

  // Worker state
  workerPid: (workerId: string) => `worker:${workerId}:pid`,
  workerLastHealth: (workerId: string) => `worker:${workerId}:health`,

  // Semantic cache
  semanticCache: (hash: string) => `semantic:cache:${hash}`,

  // Session tracking
  activeJobs: 'active-jobs',
  completedJobs: 'completed-jobs:recent',
} as const;

export const REDIS_TTL = {
  JOB_RESULT: 3600, // 1 hour
  JOB_PROGRESS: 300, // 5 minutes
  SEMANTIC_CACHE: 86400, // 24 hours
  WORKER_HEALTH: 30, // 30 seconds
} as const;

// Helper to generate consistent job IDs
export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// Helper to parse job ID
export function parseJobId(jobId: string): { timestamp: number; nonce: string } | null {
  const match = jobId.match(/^job_(\d+)_(\w+)$/);
  if (!match) return null;
  return { timestamp: parseInt(match[1], 10), nonce: match[2] };
}
