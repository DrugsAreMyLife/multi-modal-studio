import { NextRequest, NextResponse } from 'next/server';
import { getJobSubmissionService } from '@/lib/services/job-submission-service';
import { getJobResultService } from '@/lib/services/job-result-service';
import type { AudioTtsPayload, AudioTtsResponse } from '@/lib/types/audio-tts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voiceId, language = 'en-US' } = body as AudioTtsPayload & { async?: boolean };
    const isAsync = body.async !== false;

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const jobService = getJobSubmissionService();

    // Submit job to audio-tts worker
    const submission = await jobService.submitJob({
      workerId: 'audio-tts',
      payload: {
        text,
        voice_id: voiceId,
        language,
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
      } as AudioTtsResponse);
    }

    // Sync mode: wait for result
    const resultService = getJobResultService();
    const result = await resultService.waitForResult(submission.jobId, 60000);

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error?.message || 'TTS generation failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      jobId: submission.jobId,
      status: 'completed',
      audioUrl: (result.data as any)?.audio_url,
    } as AudioTtsResponse);
  } catch (error) {
    console.error('[Audio TTS API] Error:', error);
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
