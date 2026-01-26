import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { validatePrompt } from '@/lib/validation/input-validation';
import { trackApiUsage } from '@/lib/db/server';
import {
  CustomVoiceRequest,
  QwenTTSResponse,
  QwenTTSSpeaker,
  QWEN_TTS_SPEAKERS,
} from '@/lib/audio/qwen-tts-client';
import { ensureWorkerReady, getWorkerUrl } from '@/lib/workers/local-worker-manager';

/**
 * POST /api/generate/audio/qwen/custom
 *
 * Custom voice endpoint for Qwen3-TTS.
 * Uses 9 premium voice timbres with style/emotion control.
 *
 * Request body:
 * - text: string - Text to synthesize
 * - speaker: string - One of 9 premium voices
 * - language: string - Target language
 * - instruct?: string - Style/emotion instruction (e.g., "very angry tone")
 * - model?: '1.7b' | '0.6b' - Model size (default: '1.7b')
 */
export async function POST(req: NextRequest) {
  // Auth and rate limiting
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio/qwen/custom',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userId = authResult.userId;

  try {
    const body: CustomVoiceRequest = await req.json();
    const { text, speaker, language, instruct, model = '1.7b' } = body;

    // Validate text
    const textValidation = validatePrompt(text);
    if (!textValidation.valid) {
      return NextResponse.json({ success: false, error: textValidation.error }, { status: 400 });
    }

    // Validate speaker
    const validSpeakers = Object.keys(QWEN_TTS_SPEAKERS) as QwenTTSSpeaker[];
    if (!validSpeakers.includes(speaker as QwenTTSSpeaker)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid speaker. Available: ${validSpeakers.join(', ')}`,
          availableSpeakers: validSpeakers.map((s) => ({
            id: s,
            ...QWEN_TTS_SPEAKERS[s],
          })),
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
    const response = await fetch(`${workerUrl}/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        speaker,
        language,
        instruct: instruct || '',
        model,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Qwen3-TTS Custom] Worker error:', errorText);
      return NextResponse.json(
        { success: false, error: `Custom voice generation failed: ${errorText}` },
        { status: response.status },
      );
    }

    // Track usage
    await trackApiUsage({
      user_id: userId,
      provider: 'qwen-tts',
      endpoint: '/api/generate/audio/qwen/custom',
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
      model: `qwen3-tts-${model}-custom-voice`,
      speaker,
      speakerInfo: QWEN_TTS_SPEAKERS[speaker as QwenTTSSpeaker],
      provider: 'qwen-tts',
    });
  } catch (error) {
    console.error('[Qwen3-TTS Custom] Error:', error);

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
 * GET /api/generate/audio/qwen/custom
 *
 * Returns available speakers and their metadata.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio/qwen/custom',
    RATE_LIMITS.chat,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const speakers = Object.entries(QWEN_TTS_SPEAKERS).map(([id, info]) => ({
    id,
    ...info,
  }));

  return NextResponse.json({
    success: true,
    speakers,
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
    instructionExamples: [
      'Very angry tone',
      'Whisper softly',
      'Speak like a news anchor',
      'Happy and excited',
      'Sad and melancholic',
      'Speak slowly and deliberately',
    ],
  });
}
