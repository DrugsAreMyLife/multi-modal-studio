import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio/sample',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await req.json();
    const { prompt, duration_s } = body;

    const workerUrl = process.env.AUDIO_PROCESSOR_URL || 'http://localhost:8002/sample';

    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        duration_s: duration_s || 5.0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Worker failed to generate sample');
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      jobId: data.jobId,
      status: data.status,
      provider: 'stable-audio',
    });
  } catch (error: any) {
    console.error('[Sample API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });

  try {
    const workerUrl = process.env.AUDIO_PROCESSOR_URL_BASE || 'http://localhost:8002';
    const response = await fetch(`${workerUrl}/status/${jobId}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
