/**
 * Test Fixtures and Factories for SAM2 Segmentation Tests
 *
 * Provides:
 * - Mock data factories
 * - Common test payloads
 * - Reusable mock configurations
 */

import type { SegmentationPayload } from '@/lib/types/segmentation';
import type { JobResult, ProgressUpdate } from '@/lib/types/job-result';

/**
 * Factory for creating test segmentation payloads
 */
export class SegmentationPayloadFactory {
  /**
   * Create a minimal automatic mode payload
   */
  static automatic(overrides?: Partial<SegmentationPayload>): SegmentationPayload {
    return {
      imageUrl: 'https://example.com/image.jpg',
      mode: 'automatic',
      ...overrides,
    };
  }

  /**
   * Create a point mode payload
   */
  static pointMode(
    points: Array<{ x: number; y: number }>,
    overrides?: Partial<SegmentationPayload>,
  ): SegmentationPayload {
    return {
      imageUrl: 'https://example.com/image.jpg',
      mode: 'point',
      points,
      labels: new Array(points.length).fill(1), // Default to foreground
      ...overrides,
    };
  }

  /**
   * Create a box mode payload
   */
  static boxMode(
    boxes: Array<{ x1: number; y1: number; x2: number; y2: number }>,
    overrides?: Partial<SegmentationPayload>,
  ): SegmentationPayload {
    return {
      imageUrl: 'https://example.com/image.jpg',
      mode: 'box',
      boxes,
      ...overrides,
    };
  }

  /**
   * Create a background removal payload
   */
  static backgroundRemoval(overrides?: Partial<SegmentationPayload>): SegmentationPayload {
    return {
      imageUrl: 'https://example.com/image.jpg',
      mode: 'automatic',
      multimaskOutput: false,
      ...overrides,
    };
  }
}

/**
 * Factory for creating mock job results
 */
export class JobResultFactory {
  /**
   * Create a successful segmentation result
   */
  static success(jobId: string, overrides?: Partial<JobResult>): JobResult {
    return {
      jobId,
      status: 'completed',
      data: {
        masks: [`/outputs/${jobId}/mask_0.png`],
        scores: [0.95],
        inputImageUrl: 'https://example.com/image.jpg',
        outputDir: `/outputs/${jobId}`,
      },
      duration: 2500,
      completedAt: Date.now(),
      ...overrides,
    };
  }

  /**
   * Create a failed result
   */
  static failure(
    jobId: string,
    message = 'Segmentation failed',
    overrides?: Partial<JobResult>,
  ): JobResult {
    return {
      jobId,
      status: 'failed',
      error: {
        code: 'SEGMENTATION_ERROR',
        message,
      },
      duration: 1000,
      completedAt: Date.now(),
      ...overrides,
    };
  }

  /**
   * Create a timeout failure
   */
  static timeout(jobId: string, overrides?: Partial<JobResult>): JobResult {
    return JobResultFactory.failure(jobId, 'Job timed out', overrides);
  }

  /**
   * Create a multiple masks result
   */
  static multiMask(jobId: string, count = 3, overrides?: Partial<JobResult>): JobResult {
    const masks = Array.from({ length: count }, (_, i) => `/outputs/${jobId}/mask_${i}.png`);
    const scores = Array.from({ length: count }, () => 0.9 + Math.random() * 0.1);

    return {
      jobId,
      status: 'completed',
      data: {
        masks,
        scores,
        inputImageUrl: 'https://example.com/image.jpg',
        outputDir: `/outputs/${jobId}`,
      },
      duration: 5000,
      completedAt: Date.now(),
      ...overrides,
    };
  }
}

/**
 * Factory for creating mock job statuses
 */
export class JobStatusFactory {
  /**
   * Create a queued status
   */
  static queued(jobId: string, estimatedWait = 5000) {
    return {
      jobId,
      status: 'queued' as const,
      progress: 0,
      estimatedWait,
    };
  }

  /**
   * Create a processing status
   */
  static processing(jobId: string, progress = 50) {
    return {
      jobId,
      status: 'processing' as const,
      progress,
    };
  }

  /**
   * Create a completed status
   */
  static completed(jobId: string) {
    return {
      jobId,
      status: 'completed' as const,
      progress: 100,
    };
  }

  /**
   * Create a failed status
   */
  static failed(jobId: string, error?: string) {
    return {
      jobId,
      status: 'failed' as const,
      progress: 0,
      error: error || 'Model inference failed',
    };
  }
}

/**
 * Factory for progress updates
 */
export class ProgressUpdateFactory {
  static create(jobId: string, progress: number, message = ''): ProgressUpdate {
    return {
      jobId,
      progress,
      message,
      timestamp: Date.now(),
    };
  }

  static sequence(jobId: string): ProgressUpdate[] {
    return [
      ProgressUpdateFactory.create(jobId, 0, 'Starting segmentation...'),
      ProgressUpdateFactory.create(jobId, 10, 'Downloading image...'),
      ProgressUpdateFactory.create(jobId, 30, 'Preparing model...'),
      ProgressUpdateFactory.create(jobId, 40, 'Setting image...'),
      ProgressUpdateFactory.create(jobId, 60, 'Running inference...'),
      ProgressUpdateFactory.create(jobId, 80, 'Saving masks...'),
      ProgressUpdateFactory.create(jobId, 100, 'Complete'),
    ];
  }
}

/**
 * Test data constants
 */
export const TEST_DATA = {
  // Common URLs
  URLs: {
    validImage: 'https://example.com/image.jpg',
    pngImage: 'https://example.com/image.png',
    invalidUrl: 'https://invalid-domain-123456789.com/image.jpg',
  },

  // Common coordinates
  COORDINATES: {
    singlePoint: { x: 100, y: 150 },
    multiplePoints: [
      { x: 100, y: 150 },
      { x: 300, y: 250 },
    ],
    box: { x1: 50, y1: 50, x2: 300, y2: 300 },
    largeBox: { x1: 0, y1: 0, x2: 800, y2: 600 },
  },

  // Common job IDs
  JOB_IDS: {
    async: 'job_async_001',
    sync: 'job_sync_001',
    point: 'job_point_001',
    box: 'job_box_001',
    background: 'job_bg_001',
    timeout: 'job_timeout_001',
    failed: 'job_failed_001',
  },

  // Common errors
  ERRORS: {
    workerNotReady: new Error('Worker sam2 is not ready'),
    outOfMemory: new Error('Out of memory'),
    modelLoadFailed: new Error('Failed to load model'),
    imageDownloadFailed: new Error('Failed to download image'),
    inferenceTimeout: new Error('Inference timed out'),
  },

  // Expected timeouts
  TIMEOUTS: {
    jobSubmission: 30000, // 30 seconds
    syncResult: 120000, // 2 minutes
  },

  // Expected output paths
  OUTPUTS: {
    dir: (jobId: string) => `/outputs/${jobId}`,
    mask: (jobId: string, index = 0) => `/outputs/${jobId}/mask_${index}.png`,
    refined: (jobId: string) => `/outputs/${jobId}/refined.png`,
  },
};

/**
 * Mock response builders
 */
export class MockResponseBuilder {
  /**
   * Build a successful async submission response
   */
  static asyncSuccess(jobId: string) {
    return {
      jobId,
      status: 'queued' as const,
      estimatedWait: 5000,
    };
  }

  /**
   * Build a successful sync response
   */
  static syncSuccess(jobId: string) {
    return {
      jobId,
      status: 'completed' as const,
      masks: [`/outputs/${jobId}/mask_0.png`],
      inputImageUrl: TEST_DATA.URLs.validImage,
      outputDir: `/outputs/${jobId}`,
      processingTime: 2500,
    };
  }

  /**
   * Build an error response
   */
  static error(message: string) {
    return {
      error: message,
    };
  }
}

/**
 * Test request builders
 */
export class TestRequestBuilder {
  /**
   * Build a NextRequest from a payload
   */
  static post(payload: Record<string, unknown>) {
    return {
      method: 'POST' as const,
      body: JSON.stringify(payload),
      url: 'http://localhost:3000/api/segment',
    };
  }

  /**
   * Build a NextRequest for status polling
   */
  static getStatus(jobId: string) {
    return {
      method: 'GET' as const,
      url: `http://localhost:3000/api/segment?jobId=${jobId}`,
    };
  }
}
