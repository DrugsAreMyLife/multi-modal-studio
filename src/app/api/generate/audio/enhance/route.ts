import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { enhanceAudioPrompt } from '@/lib/audio/prompt-enhancer';

export async function POST(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio/enhance',
    RATE_LIMITS.chat,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { prompt, feedback, type } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const result = await enhanceAudioPrompt(prompt, feedback, type);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[Enhance API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
