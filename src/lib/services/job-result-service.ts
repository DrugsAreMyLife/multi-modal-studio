import IORedis from 'ioredis';
import { getRedisConnection } from '../redis/test-connection';
import { REDIS_CHANNELS } from '../redis/channels';
import type { JobResult, ProgressUpdate } from '../types/job-result';

export class JobResultService {
  private redis = getRedisConnection();
  private subscriber: IORedis | null = null;
  private subscriptions = new Map<string, Set<(data: unknown) => void>>();

  constructor() {}

  async waitForResult<T = unknown>(jobId: string, timeout = 300000): Promise<JobResult<T>> {
    return new Promise((resolve, reject) => {
      const channel = REDIS_CHANNELS.jobResult(jobId);
      const timer = setTimeout(() => {
        this.unsubscribe(jobId, handler);
        reject(new Error(`Job ${jobId} timed out after ${timeout}ms`));
      }, timeout);

      const handler = (data: unknown) => {
        clearTimeout(timer);
        this.unsubscribe(jobId, handler);
        resolve(data as JobResult<T>);
      };

      this.subscribe(jobId, handler);
    });
  }

  async *streamProgress(jobId: string): AsyncGenerator<ProgressUpdate> {
    const queue: ProgressUpdate[] = [];
    let done = false;
    let resolver: (() => void) | null = null;

    const handler = (data: unknown) => {
      const typedData = data as ProgressUpdate | JobResult;
      if (
        'status' in typedData &&
        (typedData.status === 'completed' || typedData.status === 'failed')
      ) {
        done = true;
      } else {
        queue.push(typedData as ProgressUpdate);
      }
      if (resolver) resolver();
    };

    this.subscribe(jobId, handler);

    try {
      while (!done || queue.length > 0) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else if (!done) {
          await new Promise<void>((r) => {
            resolver = r;
          });
          resolver = null;
        }
      }
    } finally {
      this.unsubscribe(jobId, handler);
    }
  }

  private async ensureSubscriber(): Promise<IORedis> {
    if (!this.subscriber) {
      this.subscriber = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
      this.subscriber.on('message', (channel, message) => {
        const jobId = channel.split(':').pop();
        if (jobId && this.subscriptions.has(jobId)) {
          const data = JSON.parse(message);
          this.subscriptions.get(jobId)!.forEach((cb) => cb(data));
        }
      });
    }
    return this.subscriber;
  }

  private async subscribe(jobId: string, callback: (data: unknown) => void): Promise<void> {
    const sub = await this.ensureSubscriber();

    if (!this.subscriptions.has(jobId)) {
      this.subscriptions.set(jobId, new Set());
      await sub.subscribe(REDIS_CHANNELS.jobResult(jobId), REDIS_CHANNELS.jobProgress(jobId));
    }

    this.subscriptions.get(jobId)!.add(callback);
  }

  private async unsubscribe(jobId: string, callback: (data: unknown) => void): Promise<void> {
    if (!this.subscriptions.has(jobId)) return;

    const callbacks = this.subscriptions.get(jobId)!;
    callbacks.delete(callback);

    if (callbacks.size === 0) {
      this.subscriptions.delete(jobId);
      if (this.subscriber) {
        await this.subscriber.unsubscribe(
          REDIS_CHANNELS.jobResult(jobId),
          REDIS_CHANNELS.jobProgress(jobId),
        );
      }
    }
  }

  async cleanup(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = null;
    }
    this.subscriptions.clear();
  }
}

// Singleton
let instance: JobResultService | null = null;

export function getJobResultService(): JobResultService {
  if (!instance) {
    instance = new JobResultService();
  }
  return instance;
}
