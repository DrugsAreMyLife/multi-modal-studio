import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { validatePrompt } from '@/lib/validation/input-validation';
import { trackApiUsage } from '@/lib/db/server';
import { VoiceCloneRequest, QwenTTSResponse, validateRefAudio } from '@/lib/audio/qwen-tts-client';
import { ensureWorkerReady, getWorkerUrl } from '@/lib/workers/local-worker-manager';

/**
 * POST /api/generate/audio/qwen/clone
 *
 * Voice cloning endpoint for Qwen3-TTS.
 * Clones any voice from a 3-second audio sample.
 *
 * Request body:
 * - text: string - Text to synthesize
 * - refAudio: string - Reference audio (URL, base64, or file path)
 * - refText: string - Transcript of reference audio
 * - language: string - Target language
 * - model?: '1.7b' | '0.6b' - Model size (default: '1.7b')
 * - xVectorOnlyMode?: boolean - Skip ref_text for faster inference
 */
export async function POST(req: NextRequest) {
  // Auth and rate limiting
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio/qwen/clone',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userId = authResult.userId;

  try {
    const body: VoiceCloneRequest = await req.json();
    const { text, refAudio, refText, language, model = '1.7b', xVectorOnlyMode = false } = body;

    // Validate text
    const textValidation = validatePrompt(text);
    if (!textValidation.valid) {
      return NextResponse.json({ success: false, error: textValidation.error }, { status: 400 });
    }

    // Validate reference audio
    const audioValidation = validateRefAudio(refAudio);
    if (!audioValidation.valid) {
      return NextResponse.json({ success: false, error: audioValidation.error }, { status: 400 });
    }

    // Validate ref_text (required unless xVectorOnlyMode)
    if (!xVectorOnlyMode && (!refText || refText.trim().length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reference text (transcript) is required for high-quality cloning',
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
    const response = await fetch(`${workerUrl}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        ref_audio: refAudio,
        ref_text: refText,
        language,
        model,
        x_vector_only_mode: xVectorOnlyMode,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Qwen3-TTS Clone] Worker error:', errorText);
      return NextResponse.json(
        { success: false, error: `Voice clone failed: ${errorText}` },
        { status: response.status },
      );
    }

    // Track usage (local model, no API cost but track for analytics)
    await trackApiUsage({
      user_id: userId,
      provider: 'qwen-tts',
      endpoint: '/api/generate/audio/qwen/clone',
      cost_cents: 0, // Local inference, no cost
    });

    // Check if response is streaming audio or JSON
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('audio/')) {
      // Stream audio directly
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
      model: `qwen3-tts-${model}-voice-clone`,
      provider: 'qwen-tts',
    });
  } catch (error) {
    console.error('[Qwen3-TTS Clone] Error:', error);

    // Check if worker is unavailable
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
