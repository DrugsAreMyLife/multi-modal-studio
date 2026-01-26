// Training job status polling endpoint
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { updateJobStatus, TrainingJobStatus } from '@/lib/training/job-manager';
import { getTrainingJob } from '@/lib/db/training';

/**
 * GET /api/training/status?job_id=<uuid>
 * Poll current status of a training job with real-time progress tracking
 *
 * Query Parameters:
 *   - job_id (required): UUID of the training job
 *
 * Response: TrainingJobStatus
 *   {
 *     job_id: string;
 *     status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
 *     progress_percent: number;        // 0-100
 *     current_step: number;
 *     total_steps: number;
 *     loss_history: Array<{step: number, loss: number}>;
 *     sample_images: Array<{step: number, url: string}>;
 *     error?: string;
 *     started_at?: string;             // ISO timestamp
 *     completed_at?: string;           // ISO timestamp
 *     estimated_completion?: string;   // ISO timestamp
 *   }
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Require authentication (no rate limit for status checks)
  const authResult = await requireAuth(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    // Get job_id from query parameters
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('job_id');

    // Validate job_id parameter
    if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
      return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
    }

    // Security: Validate jobId format to prevent injection
    const jobIdRegex = /^[a-zA-Z0-9_\-]+$/;
    if (!jobIdRegex.test(jobId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Verify job exists and belongs to authenticated user
    const job = await getTrainingJob(jobId, authResult.userId);
    if (!job) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Training job not found or does not belong to the requesting user',
        },
        { status: 404 },
      );
    }

    // Update job status from Docker logs if running
    const status = await updateJobStatus(jobId);

    if (!status) {
      return NextResponse.json(
        {
          error: 'Status fetch failed',
          message: 'Failed to retrieve job status',
        },
        { status: 500 },
      );
    }

    // Return status with appropriate headers
    const response = NextResponse.json(status as TrainingJobStatus, {
      status: 200,
    });

    // Add cache control headers - status endpoints can be cached briefly
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('[Training Status] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 },
    );
  }
}

/**
 * OPTIONS /api/training/status
 * CORS preflight handler
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    },
  );
}
