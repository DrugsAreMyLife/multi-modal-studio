import { NextRequest, NextResponse } from 'next/server';
import { getJobSubmissionService } from '@/lib/services/job-submission-service';
import { getJobResultService } from '@/lib/services/job-result-service';
import type { GradingApplyPayload, GradingApplyResponse } from '@/lib/types/grading';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, lutUrl, brightness, contrast, saturation } = body as GradingApplyPayload & {
      async?: boolean;
    };
    const isAsync = body.async !== false;

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    const jobService = getJobSubmissionService();

    // Submit job to color-grading worker
    const submission = await jobService.submitJob({
      workerId: 'color-grading',
      payload: {
        image_url: imageUrl,
        lut_url: lutUrl,
        brightness,
        contrast,
        saturation,
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
      } as GradingApplyResponse);
    }

    // Sync mode: wait for result
    const resultService = getJobResultService();
    const result = await resultService.waitForResult(submission.jobId, 60000);

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error?.message || 'Color grading failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      jobId: submission.jobId,
      status: 'completed',
      gradedImageUrl: (result.data as any)?.graded_image_url,
    } as GradingApplyResponse);
  } catch (error) {
    console.error('[Grading API] Error:', error);
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
