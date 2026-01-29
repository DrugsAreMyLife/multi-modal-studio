/**
 * Test Utilities for Job Submission Service Tests
 *
 * Helper functions and mock factories for testing the job submission service.
 */

import type { SubmitJobOptions, WorkerId, JobStatus } from '../../types/job-submission';

/**
 * Create a mock SubmitJobOptions object with sensible defaults
 */
export function createMockSubmitJobOptions(
  overrides?: Partial<SubmitJobOptions>,
): SubmitJobOptions {
  return {
    workerId: 'sam2',
    payload: { test: true },
    priority: 'normal',
    waitForReady: false,
    timeout: 30000,
    ...overrides,
  };
}

/**
 * Create a mock job status object
 */
export function createMockJobStatus(overrides?: Partial<JobStatus>): JobStatus {
  const now = Date.now();
  return {
    id: `job_${now}_test`,
    status: 'queued',
    workerId: 'sam2',
    progress: 0,
    createdAt: now,
    ...overrides,
  };
}

/**
 * Worker type constants for testing
 */
export const TEST_WORKERS = {
  SAM2: 'sam2' as WorkerId,
  HUNYUAN_VIDEO: 'hunyuan-video' as WorkerId,
  HUNYUAN_IMAGE: 'hunyuan-image' as WorkerId,
  QWEN_IMAGE: 'qwen-image' as WorkerId,
  QWEN_GEO: 'qwen-geo' as WorkerId,
  SVG_TURBO: 'svg-turbo' as WorkerId,
} as const;

/**
 * Worker port mapping for health checks
 */
export const WORKER_PORTS: Record<WorkerId, number> = {
  sam2: 8006,
  'hunyuan-video': 8007,
  'hunyuan-image': 8007,
  'qwen-image': 8009,
  'qwen-geo': 8009,
  'svg-turbo': 8008,
};

/**
 * Worker to model ID mapping
 */
export const WORKER_MODEL_IDS: Record<WorkerId, string> = {
  sam2: 'facebook/sam2',
  'hunyuan-video': 'tencent/hunyuan-video',
  'hunyuan-image': 'tencent/hunyuan-image',
  'qwen-image': 'alibaba/qwen-image',
  'qwen-geo': 'alibaba/qwen-geo',
  'svg-turbo': 'svg-turbo/vectorize',
};

/**
 * Create a mock Redis response
 */
export function createMockRedisResponse(data: unknown): string {
  return JSON.stringify(data);
}

/**
 * Create a mock fetch response
 */
export function createMockFetchResponse(
  ok: boolean = true,
  status: number = 200,
  body: unknown = {},
) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

/**
 * Helper to verify job was queued correctly
 */
export function verifyJobQueued(mockQueue: any, jobId: string, workerId: WorkerId) {
  expect(mockQueue.add).toHaveBeenCalledWith(
    `${workerId}-job`,
    expect.objectContaining({
      id: jobId,
      model_id: WORKER_MODEL_IDS[workerId],
    }),
    expect.objectContaining({
      jobId,
    }),
  );
}

/**
 * Helper to verify job status was stored in Redis
 */
export function verifyJobStatusStored(mockRedis: any, jobId: string) {
  expect(mockRedis.set).toHaveBeenCalledWith(
    expect.stringContaining(jobId),
    expect.stringContaining('queued'),
    'EX',
    3600,
  );
}

/**
 * Helper to set up successful job submission mocks
 */
export function setupSuccessfulJobSubmissionMocks(mockRedis: any, mockQueue: any) {
  mockRedis.set.mockResolvedValue('OK');
  mockRedis.get.mockResolvedValue(null);
  mockQueue.add.mockResolvedValue({ id: 'job_test', name: 'test-job' });
  mockQueue.getWaitingCount.mockResolvedValue(0);
}

/**
 * Helper to set up failed job submission mocks
 */
export function setupFailedJobSubmissionMocks(mockRedis: any, mockQueue: any, error: Error) {
  mockQueue.add.mockRejectedValue(error);
  mockRedis.set.mockResolvedValue('OK');
}

/**
 * Helper to set up worker health check mocks
 */
export function setupWorkerHealthCheckMocks(fetchMock: any, isHealthy: boolean = true) {
  if (isHealthy) {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
    });
  } else {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
    });
  }
}

/**
 * Delay helper for async tests
 */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  checkInterval: number = 50,
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await delay(checkInterval);
  }
}
