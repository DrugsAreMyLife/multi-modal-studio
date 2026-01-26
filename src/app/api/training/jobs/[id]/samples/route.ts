import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { getTrainingJob } from '@/lib/db/training';
import type { SampleImage } from '@/lib/types/sample-images';

/**
 * GET /api/training/jobs/{id}/samples
 * Fetch sample images generated during a training job
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // Authenticate user
    const authResult = await requireAuth(req);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    // Await params (Next.js 16+)
    const { id } = await params;
    const jobId = id;
    const userId = authResult.userId;

    // Get query parameters for pagination
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get job details from database to access sample_images array
    const job = await getTrainingJob(jobId, userId);

    // Check if job exists
    if (!job) {
      return NextResponse.json(
        {
          error: 'Job not found',
          message: `Training job with ID ${jobId} not found.`,
        },
        { status: 404 },
      );
    }

    // Get sample images from job data
    // In a real implementation, these might be stored in a separate table
    // but based on the DbTrainingJob type, they are in the job object.
    const allSamples = job.sample_images || [];

    // Sort samples by step descending (newest first)
    const sortedSamples = [...allSamples].sort((a, b) => b.step - a.step);

    // Format samples into SampleImage objects
    const formattedSamples: SampleImage[] = sortedSamples.map((sample, index) => ({
      id: `${jobId}-sample-${sample.step}-${index}`,
      url: sample.url,
      step: sample.step,
      timestamp: new Date(job.created_at).getTime(), // Fallback timestamp
      prompt: job.trigger_words?.[0] || 'Training sample',
    }));

    // Apply pagination
    const start = page * limit;
    const end = start + limit;
    const paginatedSamples = formattedSamples.slice(start, end);

    return NextResponse.json(
      {
        success: true,
        images: paginatedSamples,
        total: formattedSamples.length,
        page,
        limit,
        hasMore: end < formattedSamples.length,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Training] Samples endpoint error: ${errorMsg}`);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching sample images',
      },
      { status: 500 },
    );
  }
}
