import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { listDatasets } from '@/lib/db/training';

export async function GET(req: NextRequest) {
  // Auth and rate limiting
  const authResult = await requireAuthAndRateLimit(req, '/api/datasets', RATE_LIMITS.chat);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const datasets = await listDatasets(authResult.userId);

    return NextResponse.json(datasets);
  } catch (error) {
    console.error('[Datasets List] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch datasets',
      },
      { status: 500 },
    );
  }
}
