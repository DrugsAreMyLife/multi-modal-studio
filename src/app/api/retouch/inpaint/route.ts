import { NextRequest, NextResponse } from 'next/server';
import { getJobSubmissionService } from '@/lib/services/job-submission-service';
import { getJobResultService } from '@/lib/services/job-result-service';
import type { RetouchInpaintPayload, RetouchInpaintResponse } from '@/lib/types/retouch';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, maskUrl, prompt } = body as RetouchInpaintPayload & { async?: boolean };
    const isAsync = body.async !== false;

    if (!imageUrl || !maskUrl || !prompt) {
      return NextResponse.json(
        { error: 'imageUrl, maskUrl, and prompt are required' },
        { status: 400 },
      );
    }

    const jobService = getJobSubmissionService();

    // Submit job to retouch-inpaint worker
    const submission = await jobService.submitJob({
      workerId: 'retouch-inpaint',
      payload: {
        image_url: imageUrl,
        mask_url: maskUrl,
        prompt,
      },
      priority: 'normal',
      waitForReady: true,
      timeout: 45000,
    });

    if (isAsync) {
      return NextResponse.json({
        jobId: submission.jobId,
        status: 'queued',
        estimatedWait: submission.estimatedWait,
      } as RetouchInpaintResponse);
    }

    // Sync mode: wait for result
    const resultService = getJobResultService();
    const result = await resultService.waitForResult(submission.jobId, 90000);

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error?.message || 'Inpainting failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      jobId: submission.jobId,
      status: 'completed',
      inpaintedImageUrl: (result.data as any)?.inpainted_image_url,
    } as RetouchInpaintResponse);
  } catch (error) {
    console.error('[Retouch API] Error:', error);
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
