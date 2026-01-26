import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

/**
 * 1. Batch Queue (Generation Requests)
 * This handles grouping multiple generation requests by model_id
 */
export const batchQueue = new Queue('batch-generation-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 3600, // keep completed for 1 hour
      count: 100,
    },
    removeOnFail: {
      age: 24 * 3600, // keep failed for 24 hours (DLQ)
      count: 1000,
    },
  },
});

/**
 * 2. Notification Queue
 * This handles async broadcasting of system notifications to users
 */
export const notificationQueue = new Queue('user-notification-queue', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'fixed',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: {
      age: 24 * 3600,
      count: 500,
    },
  },
});

// Queue Monitoring
const batchQueueEvents = new QueueEvents('batch-generation-queue', { connection });
const notificationQueueEvents = new QueueEvents('user-notification-queue', { connection });

batchQueueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`[BatchQueue] Job ${jobId} failed: ${failedReason}`);
});

notificationQueueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`[NotificationQueue] Job ${jobId} failed: ${failedReason}`);
});

export { connection };
