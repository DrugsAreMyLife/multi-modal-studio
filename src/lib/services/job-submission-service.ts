import { batchQueue } from '../queue/batch-queue';
import { getRedisConnection } from '../redis/test-connection';
import { REDIS_KEYS, generateJobId } from '../redis/channels';
import type {
  WorkerId,
  SubmitJobOptions,
  SubmitJobResult,
  JobStatus,
} from '../types/job-submission';
import { checkWorkerHealth, WORKER_CONFIGS, LocalWorkerId } from '../workers/local-worker-manager';

export class JobSubmissionService {
  private redis = getRedisConnection();

  constructor() {}

  async submitJob(options: SubmitJobOptions): Promise<SubmitJobResult> {
    const jobId = generateJobId();
    const {
      workerId,
      payload,
      priority = 'normal',
      waitForReady = true,
      timeout = 30000,
    } = options;

    // Check worker readiness if requested
    if (waitForReady) {
      const isReady = await this.checkWorkerReady(workerId, timeout);
      if (!isReady) {
        throw new Error(`Worker ${workerId} is not ready`);
      }
    }

    // Check VRAM availability
    const hasVram = await this.checkVramAvailable(workerId);
    if (!hasVram) {
      throw new Error(`Insufficient VRAM for worker ${workerId}`);
    }

    // Add job to queue
    await batchQueue.add(
      `${workerId}-job`,
      {
        id: jobId,
        model_id: this.getModelId(workerId),
        payload,
        timestamp: Date.now(),
      },
      {
        priority: priority === 'high' ? 1 : priority === 'low' ? 10 : 5,
        jobId,
      },
    );

    // Store initial status
    await this.redis.set(
      REDIS_KEYS.jobStatus(jobId),
      JSON.stringify({ status: 'queued', progress: 0 }),
      'EX',
      3600,
    );

    return {
      jobId,
      status: 'queued',
      estimatedWait: await this.estimateWait(workerId),
    };
  }

  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    const data = await this.redis.get(REDIS_KEYS.jobStatus(jobId));
    if (!data) return null;
    return JSON.parse(data);
  }

  private async checkWorkerReady(workerId: WorkerId, timeout: number): Promise<boolean> {
    // Mapping from WorkerId to LocalWorkerId if they differ, or if WorkerId is a superset
    // In this project they seem to be intentionally kept identical for these services
    const localId = workerId as LocalWorkerId;
    if (!WORKER_CONFIGS[localId]) return true; // External/Unknown workers

    return checkWorkerHealth(localId);
  }

  private async checkVramAvailable(workerId: WorkerId): Promise<boolean> {
    const config = WORKER_CONFIGS[workerId as LocalWorkerId];
    if (!config) return true;

    // For now, assume VRAM is available as per original logic,
    // but we could use local-worker-manager's getAvailableVram() here.
    return true;
  }

  private getModelId(workerId: WorkerId): string {
    const modelIds: Record<WorkerId, string> = {
      sam2: 'facebook/sam2',
      'hunyuan-video': 'tencent/hunyuan-video',
      'hunyuan-image': 'tencent/hunyuan-image',
      'qwen-image': 'alibaba/qwen-image',
      'qwen-geo': 'alibaba/qwen-geo',
      'svg-turbo': 'svg-turbo/vectorize',
      'depth-anything': 'LiheYoung/depth-anything-v2-large',
      demucs: 'facebook/demucs',
      'vfx-composite': 'internal/vfx-composite',
      'color-grading': 'internal/color-grading',
      'retouch-inpaint': 'runwayml/stable-diffusion-inpainting',
      'audio-master': 'internal/audio-master',
      'audio-tts': 'alibaba/qwen3-tts',
      'video-stabilize': 'internal/video-stabilize',
      'forge-training': 'internal/dreambooth-training',
    };
    return modelIds[workerId];
  }

  private async estimateWait(workerId: WorkerId): Promise<number> {
    const waiting = await batchQueue.getWaitingCount();
    return waiting * 5000; // rough estimate: 5s per job
  }
}

// Singleton instance
let instance: JobSubmissionService | null = null;

export function getJobSubmissionService(): JobSubmissionService {
  if (!instance) {
    instance = new JobSubmissionService();
  }
  return instance;
}
