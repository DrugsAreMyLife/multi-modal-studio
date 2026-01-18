import { NextRequest, NextResponse } from 'next/server';
import { getGenerationByJobId } from '@/lib/db/server';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * GET /api/generate/image/status?jobId=xxx
 * Check the status of a background image generation job
 */
export async function GET(req: NextRequest) {
  // Auth check
  const authResult = await requireAuth(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const jobId = req.nextUrl.searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
  }

  try {
    // Check database for the job (scoped to user for security)
    const dbJob = await getGenerationByJobId(jobId, authResult.userId);

    if (dbJob) {
      return NextResponse.json({
        jobId,
        status: dbJob.status,
        result_url: dbJob.result_url,
        provider: dbJob.provider,
        created_at: new Date(dbJob.created_at).getTime(),
        source: 'database',
      });
    }

    return NextResponse.json({ error: 'Job not found', jobId }, { status: 404 });
  } catch (error) {
    console.error('[ImageStatus] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
