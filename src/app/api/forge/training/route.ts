import { NextRequest, NextResponse } from 'next/server';
import { getJobSubmissionService } from '@/lib/services/job-submission-service';
import { getJobResultService } from '@/lib/services/job-result-service';
import type { ForgeTrainingPayload, ForgeTrainingResponse } from '@/lib/types/forge-training';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images, conceptName, instancePrompt } = body as ForgeTrainingPayload & {
      async?: boolean;
    };
    const isAsync = body.async !== false;

    if (!images || images.length === 0 || !conceptName || !instancePrompt) {
      return NextResponse.json(
        { error: 'images, conceptName, and instancePrompt are required' },
        { status: 400 },
      );
    }

    const jobService = getJobSubmissionService();

    // Submit job to forge-training worker
    const submission = await jobService.submitJob({
      workerId: 'forge-training',
      payload: {
        images,
        concept_name: conceptName,
        instance_prompt: instancePrompt,
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
      } as ForgeTrainingResponse);
    }

    // Sync mode: wait for result
    const resultService = getJobResultService();
    const result = await resultService.waitForResult(submission.jobId, 1800000); // Training can take up to 30 mins

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error?.message || 'Training failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      jobId: submission.jobId,
      status: 'completed',
      modelPath: (result.data as any)?.model_path,
    } as ForgeTrainingResponse);
  } catch (error) {
    console.error('[Forge Training API] Error:', error);
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
