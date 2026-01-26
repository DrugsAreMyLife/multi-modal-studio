import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { validatePrompt } from '@/lib/validation/input-validation';
import { trackApiUsage } from '@/lib/db/server';
import {
  VoiceDesignRequest,
  QwenTTSResponse,
  VOICE_DESIGN_EXAMPLES,
} from '@/lib/audio/qwen-tts-client';
import { ensureWorkerReady, getWorkerUrl } from '@/lib/workers/local-worker-manager';

/**
 * POST /api/generate/audio/qwen/design
 *
 * Voice design endpoint for Qwen3-TTS.
 * Creates entirely new voices from natural language descriptions.
 *
 * Request body:
 * - text: string - Text to synthesize
 * - instruct: string - Voice description (age, gender, accent, emotion, style)
 * - language: string - Target language
 *
 * Note: Only available with 1.7B model (VoiceDesign variant)
 */
export async function POST(req: NextRequest) {
  // Auth and rate limiting
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio/qwen/design',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userId = authResult.userId;

  try {
    const body: VoiceDesignRequest = await req.json();
    const { text, instruct, language } = body;

    // Validate text
    const textValidation = validatePrompt(text);
    if (!textValidation.valid) {
      return NextResponse.json({ success: false, error: textValidation.error }, { status: 400 });
    }

    // Validate instruct (voice description)
    if (!instruct || instruct.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Voice description (instruct) is required',
          hint: 'Describe the voice you want: age, gender, accent, emotion, speaking style',
          examples: VOICE_DESIGN_EXAMPLES.flatMap((c) => c.examples).slice(0, 5),
        },
        { status: 400 },
      );
    }

    if (instruct.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Voice description too short. Be more descriptive for best results.',
          hint: 'Example: "Male, 17 years old, tenor range, gaining confidence"',
        },
        { status: 400 },
      );
    }

    // Validate language
    const validLanguages = [
      'Chinese',
      'English',
      'Japanese',
      'Korean',
      'German',
      'French',
      'Russian',
      'Portuguese',
      'Spanish',
      'Italian',
    ];
    if (!validLanguages.includes(language)) {
      return NextResponse.json(
        { success: false, error: `Invalid language. Supported: ${validLanguages.join(', ')}` },
        { status: 400 },
      );
    }

    // Ensure Qwen3-TTS worker is running
    const workerStatus = await ensureWorkerReady('qwen-tts');
    if (!workerStatus.ready) {
      return NextResponse.json(
        {
          success: false,
          error: `Qwen3-TTS worker failed to start: ${workerStatus.error}`,
          workerError: true,
        },
        { status: 503 },
      );
    }

    // Call Qwen3-TTS worker
    const workerUrl = getWorkerUrl('qwen-tts');
    const response = await fetch(`${workerUrl}/design`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        instruct,
        language,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Qwen3-TTS Design] Worker error:', errorText);
      return NextResponse.json(
        { success: false, error: `Voice design failed: ${errorText}` },
        { status: response.status },
      );
    }

    // Track usage
    await trackApiUsage({
      user_id: userId,
      provider: 'qwen-tts',
      endpoint: '/api/generate/audio/qwen/design',
      cost_cents: 0,
    });

    // Check if response is streaming audio or JSON
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('audio/')) {
      return new Response(response.body, {
        headers: {
          'Content-Type': contentType,
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    // JSON response with audio data
    const data: QwenTTSResponse = await response.json();

    return NextResponse.json({
      success: true,
      audioUrl: data.audioUrl,
      audioBase64: data.audioBase64,
      sampleRate: data.sampleRate || 24000,
      duration: data.duration,
      model: 'qwen3-tts-1.7b-voice-design',
      voiceDescription: instruct,
      provider: 'qwen-tts',
    });
  } catch (error) {
    console.error('[Qwen3-TTS Design] Error:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Qwen3-TTS worker connection failed. The worker may need Python dependencies installed.',
          workerError: true,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

/**
 * GET /api/generate/audio/qwen/design
 *
 * Returns voice design examples and inspiration.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio/qwen/design',
    RATE_LIMITS.chat,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  return NextResponse.json({
    success: true,
    description: 'Create any voice you can imagine using natural language descriptions.',
    examples: VOICE_DESIGN_EXAMPLES,
    tips: [
      'Be specific about age, gender, and accent for best results',
      'Describe emotional tone (nervous, confident, angry, calm)',
      'Mention speaking style (fast, slow, rhythmic, monotone)',
      'Reference known voice types (news anchor, villain, anime character)',
      'You can mix languages - describe in English, synthesize in any language',
    ],
    languages: [
      'Chinese',
      'English',
      'Japanese',
      'Korean',
      'German',
      'French',
      'Russian',
      'Portuguese',
      'Spanish',
      'Italian',
    ],
    note: 'Voice Design uses the 1.7B model only (requires ~8GB VRAM)',
  });
}
