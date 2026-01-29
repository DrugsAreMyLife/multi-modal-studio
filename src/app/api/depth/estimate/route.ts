import { NextRequest, NextResponse } from 'next/server';
import { getJobSubmissionService } from '@/lib/services/job-submission-service';
import { getJobResultService } from '@/lib/services/job-result-service';
import type { DepthPayload, DepthResponse } from '@/lib/types/depth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, model = 'v2-large' } = body as DepthPayload & { async?: boolean };
    const isAsync = body.async !== false;

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    const jobService = getJobSubmissionService();

    // Submit job to depth-anything worker
    const submission = await jobService.submitJob({
      workerId: 'depth-anything',
      payload: {
        image_url: imageUrl,
        model,
      },
      priority: 'normal',
      waitForReady: true,
      timeout: 30000,
    });

    if (isAsync) {
      return NextResponse.json({
        jobId: submission.jobId,
        status: 'queued',
        estimatedWait: submission.estimatedWait,
      } as DepthResponse);
    }

    // Sync mode: wait for result
    const resultService = getJobResultService();
    const result = await resultService.waitForResult(submission.jobId, 60000);

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error?.message || 'Depth estimation failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      jobId: submission.jobId,
      status: 'completed',
      depthMapUrl: (result.data as any)?.depth_map_url,
    } as DepthResponse);
  } catch (error) {
    console.error('[Depth API] Error:', error);
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
