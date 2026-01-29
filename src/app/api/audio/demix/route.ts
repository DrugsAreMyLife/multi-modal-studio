import { NextRequest, NextResponse } from 'next/server';
import { getJobSubmissionService } from '@/lib/services/job-submission-service';
import { getJobResultService } from '@/lib/services/job-result-service';
import type { AudioDemixPayload, AudioDemixResponse } from '@/lib/types/audio-demix';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioUrl, stems = ['vocals', 'drums', 'bass', 'other'] } = body as AudioDemixPayload & {
      async?: boolean;
    };
    const isAsync = body.async !== false;

    if (!audioUrl) {
      return NextResponse.json({ error: 'audioUrl is required' }, { status: 400 });
    }

    const jobService = getJobSubmissionService();

    // Submit job to demucs worker
    const submission = await jobService.submitJob({
      workerId: 'demucs',
      payload: {
        audio_url: audioUrl,
        stems,
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
      } as AudioDemixResponse);
    }

    // Sync mode: wait for result
    const resultService = getJobResultService();
    const result = await resultService.waitForResult(submission.jobId, 180000); // Demixing can take a while

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error?.message || 'Audio demixing failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      jobId: submission.jobId,
      status: 'completed',
      stemUrls: (result.data as any)?.stem_urls,
    } as AudioDemixResponse);
  } catch (error) {
    console.error('[Audio Demix API] Error:', error);
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
