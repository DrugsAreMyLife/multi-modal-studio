/**
 * Integration Tests for SAM2 Segmentation Pipeline
 *
 * Tests cover:
 * - E2E async/sync segmentation flow
 * - Timeout handling for slow workers
 * - Error propagation from worker failures
 * - API route validation and response formatting
 *
 * Framework: Jest (with @testing-library/jest-dom)
 * Note: Requires Jest setup with Next.js support
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import type { SegmentationPayload } from '@/lib/types/segmentation';
import type { JobResult } from '@/lib/types/job-result';

// Mock the services
jest.mock('@/lib/services/job-submission-service', () => ({
  getJobSubmissionService: jest.fn(),
}));

jest.mock('@/lib/services/job-result-service', () => ({
  getJobResultService: jest.fn(),
}));

import * as jobSubmissionModule from '@/lib/services/job-submission-service';
import * as jobResultModule from '@/lib/services/job-result-service';

describe('Segmentation API Route', () => {
  let mockJobSubmissionService: any;
  let mockJobResultService: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create mock job submission service
    mockJobSubmissionService = {
      submitJob: jest.fn(),
      getJobStatus: jest.fn(),
    };

    // Create mock job result service
    mockJobResultService = {
      waitForResult: jest.fn(),
      streamProgress: jest.fn(),
      cleanup: jest.fn(),
    };

    // Setup mock returns
    (jobSubmissionModule.getJobSubmissionService as jest.Mock).mockReturnValue(
      mockJobSubmissionService,
    );
    (jobResultModule.getJobResultService as jest.Mock).mockReturnValue(mockJobResultService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/segment - Async Mode', () => {
    it('should accept segmentation request and return job ID in async mode', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        async: true,
      };

      const jobId = 'job_123_abc';
      const estimatedWait = 5000;

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId,
        status: 'queued',
        estimatedWait,
      });

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobId).toBe(jobId);
      expect(data.status).toBe('queued');
      expect(data.estimatedWait).toBe(estimatedWait);
      expect(mockJobSubmissionService.submitJob).toHaveBeenCalledWith({
        workerId: 'sam2',
        payload: {
          image_url: 'https://example.com/image.jpg',
          points: undefined,
          labels: undefined,
          boxes: undefined,
          text_prompt: undefined,
          mode: 'automatic',
          multimask_output: false,
        },
        priority: 'normal',
        waitForReady: true,
        timeout: 30000,
      });
    });

    it('should return 400 when imageUrl is missing', async () => {
      const payload: Partial<SegmentationPayload> = {
        mode: 'automatic',
      };

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('imageUrl is required');
    });

    it('should return 400 when point mode is missing points', async () => {
      const payload: Partial<SegmentationPayload> = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'point',
        // missing points
      };

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('points are required for point mode');
    });

    it('should return 400 when box mode is missing boxes', async () => {
      const payload: Partial<SegmentationPayload> = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'box',
        // missing boxes
      };

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('boxes are required for box mode');
    });

    it('should handle point mode with points and labels', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'point',
        points: [
          { x: 100, y: 150 },
          { x: 200, y: 250 },
        ],
        labels: [1, 0],
        async: true,
      };

      const jobId = 'job_456_def';

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId,
        status: 'queued',
        estimatedWait: 3000,
      });

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobId).toBe(jobId);
      expect(mockJobSubmissionService.submitJob).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            points: [
              [100, 150],
              [200, 250],
            ],
            labels: [1, 0],
          }),
        }),
      );
    });

    it('should handle box mode with bounding boxes', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'box',
        boxes: [{ x1: 50, y1: 50, x2: 300, y2: 300 }],
        async: true,
      };

      const jobId = 'job_789_ghi';

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId,
        status: 'queued',
        estimatedWait: 2000,
      });

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobId).toBe(jobId);
      expect(mockJobSubmissionService.submitJob).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            boxes: [{ x1: 50, y1: 50, x2: 300, y2: 300 }],
          }),
        }),
      );
    });
  });

  describe('POST /api/segment - Sync Mode', () => {
    it('should wait for result in sync mode and return masks', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        async: false,
      };

      const jobId = 'job_sync_001';
      const maskUrls = ['/outputs/job_sync_001/mask_0.png'];
      const outputDir = '/outputs/job_sync_001';

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId,
        status: 'queued',
      });

      const mockResult: JobResult = {
        jobId,
        status: 'completed',
        data: {
          masks: maskUrls,
          scores: [0.95],
          inputImageUrl: payload.imageUrl,
          outputDir,
        },
        duration: 2500,
        completedAt: Date.now(),
      };

      mockJobResultService.waitForResult.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobId).toBe(jobId);
      expect(data.status).toBe('completed');
      expect(data.masks).toBeDefined();
      expect(data.outputDir).toBe(outputDir);
      expect(data.processingTime).toBe(2500);
      expect(mockJobResultService.waitForResult).toHaveBeenCalledWith(jobId, 120000);
    });

    it('should propagate error when sync mode job fails', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        async: false,
      };

      const jobId = 'job_sync_fail_001';

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId,
        status: 'queued',
      });

      const mockResult: JobResult = {
        jobId,
        status: 'failed',
        error: {
          code: 'SEGMENTATION_ERROR',
          message: 'Model inference failed',
        },
        duration: 1500,
        completedAt: Date.now(),
      };

      mockJobResultService.waitForResult.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Model inference failed');
    });

    it('should return generic error message when result error is missing', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        async: false,
      };

      const jobId = 'job_sync_err_002';

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId,
        status: 'queued',
      });

      const mockResult: JobResult = {
        jobId,
        status: 'failed',
        error: undefined,
        duration: 1000,
        completedAt: Date.now(),
      };

      mockJobResultService.waitForResult.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Segmentation failed');
    });
  });

  describe('POST /api/segment - Error Handling', () => {
    it('should handle job submission service errors', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        async: true,
      };

      const error = new Error('Worker sam2 is not ready');
      mockJobSubmissionService.submitJob.mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Worker sam2 is not ready');
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: 'invalid json {',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should convert segmentation error to string message', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        async: true,
      };

      const error = new Error('Out of memory');
      mockJobSubmissionService.submitJob.mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Out of memory');
    });

    it('should handle non-Error exceptions', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        async: true,
      };

      mockJobSubmissionService.submitJob.mockRejectedValue('Unknown error');

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/segment - Timeout Handling', () => {
    it('should propagate timeout error from job submission', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        async: true,
      };

      const timeoutError = new Error('Worker sam2 is not ready');
      mockJobSubmissionService.submitJob.mockRejectedValue(timeoutError);

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Worker');
    });

    it('should timeout when waiting for sync mode result', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        async: false,
      };

      const jobId = 'job_timeout_001';

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId,
        status: 'queued',
      });

      const timeoutError = new Error(`Job ${jobId} timed out after 120000ms`);
      mockJobResultService.waitForResult.mockRejectedValue(timeoutError);

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('timed out');
    });

    it('should use 30s timeout for job submission', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        async: true,
      };

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId: 'job_001',
        status: 'queued',
      });

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await POST(request);

      expect(mockJobSubmissionService.submitJob).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000,
        }),
      );
    });

    it('should use 120s timeout for sync mode result waiting', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        async: false,
      };

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId: 'job_001',
        status: 'queued',
      });

      mockJobResultService.waitForResult.mockResolvedValue({
        jobId: 'job_001',
        status: 'completed',
        data: {
          masks: [],
          scores: [],
          inputImageUrl: payload.imageUrl,
          outputDir: '/outputs/job_001',
        },
        duration: 1000,
        completedAt: Date.now(),
      });

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await POST(request);

      expect(mockJobResultService.waitForResult).toHaveBeenCalledWith('job_001', 120000);
    });
  });

  describe('GET /api/segment - Job Status Polling', () => {
    it('should retrieve job status by jobId', async () => {
      const jobId = 'job_status_001';
      const status = {
        jobId,
        status: 'processing' as const,
        progress: 45,
      };

      mockJobSubmissionService.getJobStatus.mockResolvedValue(status);

      const url = new URL('http://localhost:3000/api/segment');
      url.searchParams.set('jobId', jobId);
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobId).toBe(jobId);
      expect(data.status).toBe('processing');
      expect(data.progress).toBe(45);
      expect(mockJobSubmissionService.getJobStatus).toHaveBeenCalledWith(jobId);
    });

    it('should return 400 when jobId parameter is missing', async () => {
      const url = new URL('http://localhost:3000/api/segment');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('jobId query parameter is required');
    });

    it('should return 404 when job is not found', async () => {
      const jobId = 'job_notfound_001';

      mockJobSubmissionService.getJobStatus.mockResolvedValue(null);

      const url = new URL('http://localhost:3000/api/segment');
      url.searchParams.set('jobId', jobId);
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Job not found');
    });

    it('should return completed status with results', async () => {
      const jobId = 'job_completed_001';
      const status = {
        jobId,
        status: 'completed' as const,
        progress: 100,
      };

      mockJobSubmissionService.getJobStatus.mockResolvedValue(status);

      const url = new URL('http://localhost:3000/api/segment');
      url.searchParams.set('jobId', jobId);
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('completed');
      expect(data.progress).toBe(100);
    });

    it('should return failed status with error', async () => {
      const jobId = 'job_failed_001';
      const status = {
        jobId,
        status: 'failed' as const,
        progress: 0,
        error: 'Model inference timeout',
      };

      mockJobSubmissionService.getJobStatus.mockResolvedValue(status);

      const url = new URL('http://localhost:3000/api/segment');
      url.searchParams.set('jobId', jobId);
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('failed');
      expect(data.error).toBe('Model inference timeout');
    });
  });

  describe('E2E Flow - Complete Segmentation Pipeline', () => {
    it('should complete full async pipeline: submit -> poll -> get results', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const jobId = 'job_e2e_001';
      const maskUrls = ['/outputs/job_e2e_001/mask_0.png', '/outputs/job_e2e_001/mask_1.png'];
      const outputDir = '/outputs/job_e2e_001';

      // Step 1: Submit async job
      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId,
        status: 'queued',
        estimatedWait: 5000,
      });

      const submitPayload: SegmentationPayload & { async?: boolean } = {
        imageUrl,
        mode: 'automatic',
        async: true,
      };

      const submitRequest = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(submitPayload),
      });

      const submitResponse = await POST(submitRequest);
      const submitData = await submitResponse.json();

      expect(submitResponse.status).toBe(200);
      expect(submitData.jobId).toBe(jobId);
      expect(submitData.status).toBe('queued');

      // Step 2: Poll status while processing
      mockJobSubmissionService.getJobStatus.mockResolvedValueOnce({
        jobId,
        status: 'processing',
        progress: 25,
      });

      let pollUrl = new URL('http://localhost:3000/api/segment');
      pollUrl.searchParams.set('jobId', jobId);
      let pollRequest = new NextRequest(pollUrl);
      let pollResponse = await GET(pollRequest);
      let pollData = await pollResponse.json();

      expect(pollResponse.status).toBe(200);
      expect(pollData.status).toBe('processing');
      expect(pollData.progress).toBe(25);

      // Step 3: Poll status when completed
      mockJobSubmissionService.getJobStatus.mockResolvedValueOnce({
        jobId,
        status: 'completed',
        progress: 100,
      });

      pollUrl = new URL('http://localhost:3000/api/segment');
      pollUrl.searchParams.set('jobId', jobId);
      pollRequest = new NextRequest(pollUrl);
      pollResponse = await GET(pollRequest);
      pollData = await pollResponse.json();

      expect(pollResponse.status).toBe(200);
      expect(pollData.status).toBe('completed');
      expect(pollData.progress).toBe(100);
    });

    it('should handle point-based segmentation with interactive refinement', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const jobId = 'job_point_interactive_001';

      // Submit point-based segmentation
      const pointPayload: SegmentationPayload & { async?: boolean } = {
        imageUrl,
        mode: 'point',
        points: [{ x: 150, y: 200 }],
        labels: [1],
        async: true,
      };

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId,
        status: 'queued',
      });

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(pointPayload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobId).toBe(jobId);
      expect(mockJobSubmissionService.submitJob).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            points: [[150, 200]],
            labels: [1],
            mode: 'point',
          }),
        }),
      );
    });

    it('should handle background removal use case', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const jobId = 'job_bg_removal_001';

      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl,
        mode: 'automatic',
        multimaskOutput: false,
        async: false,
      };

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId,
        status: 'queued',
      });

      const maskUrl = `/outputs/${jobId}/mask_0.png`;
      const result: JobResult = {
        jobId,
        status: 'completed',
        data: {
          masks: [maskUrl],
          scores: [0.92],
          inputImageUrl: imageUrl,
          outputDir: `/outputs/${jobId}`,
        },
        duration: 3000,
        completedAt: Date.now(),
      };

      mockJobResultService.waitForResult.mockResolvedValue(result);

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('completed');
      expect(data.masks).toBeDefined();
      expect(data.processingTime).toBe(3000);
    });
  });

  describe('Worker Interaction and Payload Transformation', () => {
    it('should transform Point2D to coordinate arrays', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'point',
        points: [
          { x: 100, y: 200 },
          { x: 300, y: 400 },
        ],
        labels: [1, 0],
        async: true,
      };

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId: 'job_001',
        status: 'queued',
      });

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await POST(request);

      const submitCall = mockJobSubmissionService.submitJob.mock.calls[0][0];
      expect(submitCall.payload.points).toEqual([
        [100, 200],
        [300, 400],
      ]);
    });

    it('should set multimask_output flag correctly', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        multimaskOutput: true,
        async: true,
      };

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId: 'job_001',
        status: 'queued',
      });

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await POST(request);

      const submitCall = mockJobSubmissionService.submitJob.mock.calls[0][0];
      expect(submitCall.payload.multimask_output).toBe(true);
    });

    it('should use sam2 as worker ID for all segmentation requests', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        async: true,
      };

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId: 'job_001',
        status: 'queued',
      });

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await POST(request);

      const submitCall = mockJobSubmissionService.submitJob.mock.calls[0][0];
      expect(submitCall.workerId).toBe('sam2');
    });

    it('should use normal priority and wait for ready by default', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        async: true,
      };

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId: 'job_001',
        status: 'queued',
      });

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await POST(request);

      const submitCall = mockJobSubmissionService.submitJob.mock.calls[0][0];
      expect(submitCall.priority).toBe('normal');
      expect(submitCall.waitForReady).toBe(true);
    });
  });

  describe('Response Format Validation', () => {
    it('should include all required fields in async response', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        async: true,
      };

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId: 'job_001',
        status: 'queued',
        estimatedWait: 5000,
      });

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('jobId');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('estimatedWait');
    });

    it('should include masks in sync mode response', async () => {
      const payload: SegmentationPayload & { async?: boolean } = {
        imageUrl: 'https://example.com/image.jpg',
        mode: 'automatic',
        async: false,
      };

      mockJobSubmissionService.submitJob.mockResolvedValue({
        jobId: 'job_001',
        status: 'queued',
      });

      mockJobResultService.waitForResult.mockResolvedValue({
        jobId: 'job_001',
        status: 'completed',
        data: {
          masks: ['/outputs/mask_0.png'],
          scores: [0.95],
          inputImageUrl: payload.imageUrl,
          outputDir: '/outputs/job_001',
        },
        duration: 2000,
        completedAt: Date.now(),
      });

      const request = new NextRequest('http://localhost:3000/api/segment', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('jobId');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('masks');
      expect(data).toHaveProperty('inputImageUrl');
      expect(data).toHaveProperty('outputDir');
      expect(data).toHaveProperty('processingTime');
    });
  });
});
