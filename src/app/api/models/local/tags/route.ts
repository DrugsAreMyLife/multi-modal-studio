import { NextRequest, NextResponse } from 'next/server';
import { getInstalledModels } from '@/lib/ollama';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Auth and rate limiting check
  const authResult = await requireAuthAndRateLimit(req, '/api/models/local/tags', RATE_LIMITS.chat);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const models = await getInstalledModels();
    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch local models' }, { status: 500 });
  }
}
