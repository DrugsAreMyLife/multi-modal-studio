import { NextRequest } from 'next/server';
import { POST } from '../route';
import { getJobSubmissionService } from '@/lib/services/job-submission-service';

jest.mock('@/lib/services/job-submission-service');

describe('Video Stabilize API', () => {
  it('should return 400 if videoUrl is missing', async () => {
    const req = new NextRequest('http://localhost/api/video/stabilize', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should submit a job and return jobId', async () => {
    const mockSubmitJob = jest.fn().mockResolvedValue({
      jobId: 'test-job-id',
      status: 'queued',
      estimatedWait: 5000,
    });
    (getJobSubmissionService as jest.Mock).mockReturnValue({
      submitJob: mockSubmitJob,
    });

    const req = new NextRequest('http://localhost/api/video/stabilize', {
      method: 'POST',
      body: JSON.stringify({ videoUrl: 'video.mp4' }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.jobId).toBe('test-job-id');
    expect(mockSubmitJob).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId: 'video-stabilize',
      }),
    );
  });
});
