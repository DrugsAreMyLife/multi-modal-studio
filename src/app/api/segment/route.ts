import { NextRequest, NextResponse } from 'next/server';
import { getJobSubmissionService } from '@/lib/services/job-submission-service';
import { getJobResultService } from '@/lib/services/job-result-service';
import type { SegmentationPayload, SegmentationResponse } from '@/lib/types/segmentation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      imageUrl,
      points,
      labels,
      boxes,
      textPrompt,
      mode = 'automatic',
      async = true,
      multimaskOutput = false,
    } = body as SegmentationPayload & { async?: boolean };

    // Validate required fields
    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    // Validate mode-specific requirements
    if (mode === 'point' && (!points || points.length === 0)) {
      return NextResponse.json({ error: 'points are required for point mode' }, { status: 400 });
    }

    if (mode === 'box' && (!boxes || boxes.length === 0)) {
      return NextResponse.json({ error: 'boxes are required for box mode' }, { status: 400 });
    }

    const jobService = getJobSubmissionService();

    // Submit job to SAM2 worker
    const submission = await jobService.submitJob({
      workerId: 'sam2',
      payload: {
        image_url: imageUrl,
        points: points?.map((p) => [p.x, p.y]),
        labels,
        boxes,
        text_prompt: textPrompt,
        mode,
        multimask_output: multimaskOutput,
      },
      priority: 'normal',
      waitForReady: true,
      timeout: 30000,
    });

    // If async mode, return job ID immediately
    if (async) {
      return NextResponse.json({
        jobId: submission.jobId,
        status: 'queued',
        estimatedWait: submission.estimatedWait,
      } as SegmentationResponse);
    }

    // Sync mode: wait for result
    const resultService = getJobResultService();
    const result = await resultService.waitForResult(submission.jobId, 120000);

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error?.message || 'Segmentation failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      jobId: submission.jobId,
      status: 'completed',
      masks: (result.data as Record<string, unknown>)?.masks || [],
      inputImageUrl: imageUrl,
      outputDir: (result.data as Record<string, unknown>)?.outputDir,
      processingTime: result.duration,
    } as SegmentationResponse);
  } catch (error) {
    console.error('[Segment API] Error:', error);
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
