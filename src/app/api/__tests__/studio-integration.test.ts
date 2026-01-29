import { NextRequest } from 'next/server';
import { POST as depthPOST } from '../../depth/estimate/route';
import { POST as audioPOST } from '../../audio/demix/route';
import { getJobSubmissionService } from '@/lib/services/job-submission-service';
import { getJobResultService } from '@/lib/services/job-result-service';

jest.mock('@/lib/services/job-submission-service');
jest.mock('@/lib/services/job-result-service');

describe('Unified Studio Integration Flows', () => {
  const mockJobId = 'test-job-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Depth Studio Flow', () => {
    it('should complete a full sync depth estimation flow', async () => {
      const mockSubmitJob = jest.fn().mockResolvedValue({
        jobId: mockJobId,
        status: 'queued',
      });
      const mockWaitForResult = jest.fn().mockResolvedValue({
        status: 'completed',
        data: { depth_map_url: 'http://example.com/depth.png' },
      });

      (getJobSubmissionService as jest.Mock).mockReturnValue({
        submitJob: mockSubmitJob,
      });
      (getJobResultService as jest.Mock).mockReturnValue({
        waitForResult: mockWaitForResult,
      });

      const req = new NextRequest('http://localhost/api/depth/estimate', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl: 'http://example.com/source.jpg',
          async: false,
        }),
      });

      const res = await depthPOST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe('completed');
      expect(data.depthMapUrl).toBe('http://example.com/depth.png');
      expect(mockSubmitJob).toHaveBeenCalledWith(
        expect.objectContaining({
          workerId: 'depth-anything',
        }),
      );
    });
  });

  describe('Acoustic Studio Flow', () => {
    it('should handle async audio demixing request', async () => {
      const mockSubmitJob = jest.fn().mockResolvedValue({
        jobId: mockJobId,
        status: 'queued',
        estimatedWait: 10000,
      });

      (getJobSubmissionService as jest.Mock).mockReturnValue({
        submitJob: mockSubmitJob,
      });

      const req = new NextRequest('http://localhost/api/audio/demix', {
        method: 'POST',
        body: JSON.stringify({
          audioUrl: 'http://example.com/song.mp3',
          async: true,
        }),
      });

      const res = await audioPOST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.jobId).toBe(mockJobId);
      expect(data.status).toBe('queued');
      expect(mockSubmitJob).toHaveBeenCalledWith(
        expect.objectContaining({
          workerId: 'demucs',
        }),
      );
    });
  });
});
