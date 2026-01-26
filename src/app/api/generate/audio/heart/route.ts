import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { getTagsForArtist } from '@/lib/audio/artist-styles';
import { validatePrompt, safeJsonParse, validateUUID } from '@/lib/validation/input-validation';
import { ensureWorkerReady, getWorkerUrl } from '@/lib/workers/local-worker-manager';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuthAndRateLimit(
      req,
      '/api/generate/audio/heart',
      RATE_LIMITS.generation,
    );
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const {
      data: body,
      error: parseError,
      statusCode,
    } = await safeJsonParse<{
      prompt?: string;
      artist?: string;
      lyrics?: string;
      duration_ms?: number;
    }>(req);

    if (parseError || !body) {
      return NextResponse.json(
        { success: false, error: parseError || 'Invalid request body' },
        { status: statusCode || 400 },
      );
    }

    const { prompt, artist, lyrics, duration_ms } = body;

    // Validate prompt/tags length
    const validation = validatePrompt(prompt || artist || '');
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Determine tags based on artist or direct prompt
    let finalTags = prompt;
    if (artist) {
      const artistTags = getTagsForArtist(artist);
      finalTags = prompt ? `${artistTags}, ${prompt}` : artistTags;
    }

    // Ensure Heart worker is running (auto-starts if needed)
    const workerStatus = await ensureWorkerReady('heart');
    if (!workerStatus.ready) {
      return NextResponse.json(
        {
          success: false,
          error: `Heart Music worker failed to start: ${workerStatus.error}`,
          workerError: true,
          workerId: 'heart',
        },
        { status: 503 },
      );
    }

    // Forward request to local Python worker
    const workerUrl = getWorkerUrl('heart');
    const response = await fetch(`${workerUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt || `In the style of ${artist}`,
        tags: finalTags,
        lyrics: lyrics || '',
        duration_ms: duration_ms || 30000,
        version: '3B',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to communicate with Heart Worker');
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      jobId: data.jobId,
      status: data.status,
      provider: 'heart',
    });
  } catch (error: unknown) {
    console.error('[Heart API] Error:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Heart worker connection failed. Python dependencies may need to be installed.',
          workerError: true,
          workerId: 'heart',
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  // Require auth and rate limiting even for status checks (prevent unauthenticated polling)
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio/heart',
    RATE_LIMITS.chat,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId || !validateUUID(jobId)) {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing jobId' },
      { status: 400 },
    );
  }

  try {
    const workerUrl = getWorkerUrl('heart');
    const response = await fetch(`${workerUrl}/status/${jobId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch status from worker');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
