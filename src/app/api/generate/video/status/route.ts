import { NextRequest, NextResponse } from 'next/server';
import {
  getVideoJobByProviderId,
  updateVideoJob,
  getGenerationByJobId,
  updateGenerationResult,
} from '@/lib/db/server';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * GET /api/generate/video/status?jobId=xxx
 * Check the status of a video generation job (DB-backed)
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

  // 1. Check in video_jobs table first
  const dbVideoJob = await getVideoJobByProviderId(jobId);
  if (dbVideoJob) {
    return NextResponse.json({
      jobId,
      status: dbVideoJob.status,
      result_url: dbVideoJob.result_url,
      error: dbVideoJob.error,
      provider: dbVideoJob.provider,
      metadata: dbVideoJob.metadata,
      created_at: new Date(dbVideoJob.created_at).getTime(),
      source: 'database:video_jobs',
    });
  }

  // 2. Fallback: Check generations table
  const dbGen = await getGenerationByJobId(jobId);
  if (dbGen) {
    return NextResponse.json({
      jobId,
      status: dbGen.status,
      result_url: dbGen.result_url,
      provider: dbGen.provider,
      created_at: new Date(dbGen.created_at).getTime(),
      source: 'database:generations',
    });
  }

  return NextResponse.json({ error: 'Job not found', jobId }, { status: 404 });
}

/**
 * Helper to update a job in the database
 */
export async function setVideoJobStatus(
  jobId: string,
  updates: {
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    result_url?: string;
    error?: string;
    progress?: number;
    metadata?: Record<string, any>;
  },
) {
  // Update both tables for consistency if they exist
  await Promise.all([
    updateVideoJob(jobId, updates),
    updateGenerationResult(jobId, {
      resultUrl: updates.result_url,
      status: updates.status,
      metadata: updates.metadata,
    }),
  ]);
}
