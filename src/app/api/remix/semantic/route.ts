import { NextRequest, NextResponse } from 'next/server';
import { getJobSubmissionService } from '@/lib/services/job-submission-service';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/remix/semantic',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) return authResult.response;

  try {
    const { imageUrl, instruction } = await req.json();

    if (!imageUrl || !instruction) {
      return NextResponse.json({ error: 'imageUrl and instruction are required' }, { status: 400 });
    }

    const jobService = getJobSubmissionService();
    const result = await jobService.submitJob({
      workerId: 'qwen-vl-max', // Or a specialized remix worker
      payload: { image_url: imageUrl, instruction },
      priority: 'normal',
      waitForReady: true,
    });

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      status: result.status,
    });
  } catch (error) {
    console.error('[Semantic Remix API] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
