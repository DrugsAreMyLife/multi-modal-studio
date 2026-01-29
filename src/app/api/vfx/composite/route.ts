import { NextRequest, NextResponse } from 'next/server';
import { getJobSubmissionService } from '@/lib/services/job-submission-service';
import { getJobResultService } from '@/lib/services/job-result-service';
import type { VfxCompositePayload, VfxCompositeResponse } from '@/lib/types/vfx';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      subjectUrl,
      backgroundUrl,
      mode = 'alpha-matting',
    } = body as VfxCompositePayload & { async?: boolean };
    const isAsync = body.async !== false;

    if (!subjectUrl || !backgroundUrl) {
      return NextResponse.json(
        { error: 'subjectUrl and backgroundUrl are required' },
        { status: 400 },
      );
    }

    const jobService = getJobSubmissionService();

    // Submit job to vfx-composite worker
    const submission = await jobService.submitJob({
      workerId: 'vfx-composite',
      payload: {
        subject_url: subjectUrl,
        background_url: backgroundUrl,
        mode,
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
      } as VfxCompositeResponse);
    }

    // Sync mode: wait for result
    const resultService = getJobResultService();
    const result = await resultService.waitForResult(submission.jobId, 60000);

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error?.message || 'VFX compositing failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      jobId: submission.jobId,
      status: 'completed',
      compositionUrl: (result.data as any)?.composition_url,
    } as VfxCompositeResponse);
  } catch (error) {
    console.error('[VFX API] Error:', error);
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
