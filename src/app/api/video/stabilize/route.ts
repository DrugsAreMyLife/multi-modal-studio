import { NextRequest, NextResponse } from 'next/server';
import { getJobSubmissionService } from '@/lib/services/job-submission-service';
import { getJobResultService } from '@/lib/services/job-result-service';
import type { VideoStabilizePayload, VideoStabilizeResponse } from '@/lib/types/video-stabilize';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl, intensity = 0.5 } = body as VideoStabilizePayload & { async?: boolean };
    const isAsync = body.async !== false;

    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 });
    }

    const jobService = getJobSubmissionService();

    // Submit job to video-stabilize worker
    const submission = await jobService.submitJob({
      workerId: 'video-stabilize',
      payload: {
        video_url: videoUrl,
        intensity,
      },
      priority: 'low',
      waitForReady: true,
      timeout: 30000,
    });

    if (isAsync) {
      return NextResponse.json({
        jobId: submission.jobId,
        status: 'queued',
        estimatedWait: submission.estimatedWait,
      } as VideoStabilizeResponse);
    }

    // Sync mode: wait for result
    const resultService = getJobResultService();
    const result = await resultService.waitForResult(submission.jobId, 120000);

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error?.message || 'Stabilization failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      jobId: submission.jobId,
      status: 'completed',
      stabilizedVideoUrl: (result.data as any)?.stabilized_video_url,
    } as VideoStabilizeResponse);
  } catch (error) {
    console.error('[Video Stabilize API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'jobId query parameter is required' }, { status: 400 });
  }

  const jobService = getJobSubmissionService();
  const status = await jobService.getJobStatus(jobId);

  if (!status) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(status);
}
