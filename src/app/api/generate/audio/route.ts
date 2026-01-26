import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { validatePrompt } from '@/lib/validation/input-validation';
import {
  validateModelId,
  validateModelParameters,
  getProviderForModel,
  resolveModelId,
  getResolvedModel,
} from '@/lib/validation/model-validation';
import { trackApiUsage } from '@/lib/db/server';
import { batchQueue } from '@/lib/queue/batch-queue';
import { ensureWorkerReady } from '@/lib/workers/local-worker-manager';
import { streamWithTimeout } from '@/lib/utils/stream-utils';

interface AudioGenerationRequest {
  text: string;
  modelId?: string; // Preferred: model ID from generation-models.ts
  provider?: 'elevenlabs' | 'openai' | 'nvidia' | 'local'; // Legacy: direct provider
  modelParams?: Record<string, any>; // Dynamic parameters from model definition
  voiceId?: string;
  model?: string;
}

interface AudioGenerationResponse {
  success: boolean;
  audioUrl?: string;
  audioBase64?: string;
  error?: string;
}
async function generateWithElevenLabs(text: string, options: any): Promise<Response> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  const voiceId = options.voiceId || '21m00Tcm4TlvDq8ikWAM';
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: options.model || 'eleven_multilingual_v3',
      voice_settings: {
        stability: 0.35, // Updated for v3's more expressive nature
        similarity_boost: 0.8,
        style: 0.2, // New v3 parameter
        use_speaker_boost: true, // New v3 parameter
      },
    }),
  });

  return response;
}

async function generateWithOpenAI(text: string, options: any): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'tts-2-hd', // Jan 2026 flagship
      input: text,
      voice: options.voiceId || 'alloy',
      response_format: 'mp3',
    }),
  });

  return response;
}

/**
 * NVIDIA PersonaPlex - Full-duplex conversational voice AI
 * Runs locally via Python worker (7B parameter model)
 */
interface PersonaPlexOptions {
  voice_prompt?: string; // Audio reference for voice cloning
  persona_description?: string; // Natural language persona description
  enable_backchannels?: boolean; // Enable "uh-huh", "oh", etc.
  enable_interruptions?: boolean; // Handle natural turn-taking
  emotional_expression?: number; // 0-1 intensity of emotional cues
  sample_rate?: string; // 16000, 24000, or 48000
  streaming_mode?: boolean; // Real-time streaming output
}

async function generateWithPersonaPlex(
  text: string,
  options: PersonaPlexOptions,
): Promise<{ success: boolean; jobId?: string; error?: string; audioUrl?: string }> {
  // PersonaPlex runs locally - ensure worker is ready
  const workerReady = await ensureWorkerReady('nvidia-personaplex');
  if (!workerReady.ready) {
    return { success: false, error: workerReady.error };
  }

  // Queue the generation job
  const job = await batchQueue.add('generation', {
    model_id: 'nvidia-personaplex',
    payload: {
      text,
      voice_prompt: options.voice_prompt,
      persona_description:
        options.persona_description || 'A friendly and helpful conversational assistant',
      enable_backchannels: options.enable_backchannels ?? true,
      enable_interruptions: options.enable_interruptions ?? true,
      emotional_expression: options.emotional_expression ?? 0.5,
      sample_rate: parseInt(options.sample_rate || '24000'),
      streaming_mode: options.streaming_mode ?? true,
    },
  });

  return {
    success: true,
    jobId: job.id,
  };
}

export async function POST(req: NextRequest) {
  // Auth and rate limiting check
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userId = authResult.userId;

  try {
    const body: AudioGenerationRequest = await req.json();
    const { text, modelId, provider: legacyProvider, modelParams, ...options } = body;

    // Validate text input
    const promptValidation = validatePrompt(text);
    if (!promptValidation.valid) {
      return NextResponse.json({ success: false, error: promptValidation.error }, { status: 400 });
    }

    // Determine provider from modelId or fallback to legacy provider
    let provider: string | null = legacyProvider ?? null;
    let resolvedModelId: string | undefined;
    let validatedParams = { ...options, ...modelParams };

    if (modelId) {
      // Validate and resolve model ID
      const modelValidation = validateModelId(modelId, 'audio');
      if (!modelValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: modelValidation.errors.join(', '),
            warnings: modelValidation.warnings,
          },
          { status: 400 },
        );
      }

      resolvedModelId = resolveModelId(modelId);
      provider = getProviderForModel(resolvedModelId);

      // Log warnings for legacy model IDs
      if (modelValidation.warnings.length > 0) {
        console.warn('[AudioGeneration] Model ID warnings:', modelValidation.warnings);
      }

      // Validate parameters against model definition
      if (modelParams) {
        const paramValidation = validateModelParameters(resolvedModelId, modelParams);
        if (!paramValidation.valid) {
          return NextResponse.json(
            {
              success: false,
              error: paramValidation.errors.join(', '),
              warnings: paramValidation.warnings,
            },
            { status: 400 },
          );
        }
        validatedParams = { ...options, ...paramValidation.validatedParams };

        // Log parameter warnings
        if (paramValidation.warnings.length > 0) {
          console.warn('[AudioGeneration] Parameter warnings:', paramValidation.warnings);
        }
      }
    }

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Either modelId or provider is required' },
        { status: 400 },
      );
    }

    // Handle PersonaPlex (local, async job)
    if (provider === 'nvidia' || resolvedModelId === 'nvidia-personaplex') {
      // Extract PersonaPlex-specific options from model params
      const mp = modelParams as Record<string, any> | undefined;
      const personaPlexOptions: PersonaPlexOptions = {
        voice_prompt: mp?.voice_prompt,
        persona_description: mp?.persona_description,
        enable_backchannels: mp?.enable_backchannels,
        enable_interruptions: mp?.enable_interruptions,
        emotional_expression: mp?.emotional_expression,
        sample_rate: mp?.sample_rate,
        streaming_mode: mp?.streaming_mode,
      };
      const personaResult = await generateWithPersonaPlex(text, personaPlexOptions);

      if (!personaResult.success) {
        return NextResponse.json({ success: false, error: personaResult.error }, { status: 500 });
      }

      // Track usage (PersonaPlex is local, so no cost)
      await trackApiUsage({
        user_id: userId,
        provider: 'nvidia',
        endpoint: `/api/generate/audio`,
        cost_cents: 0,
      });

      console.log(`[AudioGeneration] PersonaPlex job started`, {
        modelId: resolvedModelId,
        jobId: personaResult.jobId,
      });

      return NextResponse.json({
        success: true,
        jobId: personaResult.jobId,
        modelId: resolvedModelId || 'nvidia-personaplex',
        provider: 'nvidia',
        status: 'pending',
        message: 'PersonaPlex generation started. Use jobId to check status.',
      });
    }

    // Handle streaming providers (ElevenLabs, OpenAI)
    let response: Response;

    switch (provider) {
      case 'elevenlabs':
        response = await generateWithElevenLabs(text, validatedParams);
        break;
      case 'openai':
        response = await generateWithOpenAI(text, validatedParams);
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Unknown provider: ${provider}` },
          { status: 400 },
        );
    }

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { success: false, error: `Upstream error: ${error}` },
        { status: response.status },
      );
    }

    // Track usage (Estimated costs based on characters)
    const modelDef = resolvedModelId ? getResolvedModel(resolvedModelId) : null;
    let costCents = 1;
    if (modelDef?.pricing?.perGeneration) {
      costCents = Math.round(modelDef.pricing.perGeneration * 100);
    } else if (provider === 'elevenlabs') {
      costCents = Math.max(1, Math.ceil(text.length * 0.005));
    } else if (provider === 'openai') {
      costCents = Math.max(1, Math.ceil(text.length * 0.002));
    }

    await trackApiUsage({
      user_id: userId,
      provider,
      endpoint: `/api/generate/audio`,
      cost_cents: costCents,
    });

    console.log(`[AudioGeneration] Streaming response`, {
      modelId: resolvedModelId,
      provider,
    });

    // Return the stream directly with timeout protection
    if (!response.body) {
      return NextResponse.json(
        { success: false, error: 'Empty response body from provider' },
        { status: 500 },
      );
    }

    const stream = streamWithTimeout(response.body, 60000); // 60s timeout for audio

    return new Response(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
        'X-Model-Id': resolvedModelId || 'unknown',
        'X-Provider': provider,
      },
    });
  } catch (error) {
    console.error('[Audio API] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// GET endpoint to list available voices
export async function GET(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(req, '/api/generate/audio', RATE_LIMITS.chat);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const provider = req.nextUrl.searchParams.get('provider') || 'openai';

  if (provider === 'openai') {
    return NextResponse.json({
      success: true,
      voices: [
        { id: 'alloy', name: 'Alloy', gender: 'neutral' },
        { id: 'echo', name: 'Echo', gender: 'male' },
        { id: 'fable', name: 'Fable', gender: 'male' },
        { id: 'onyx', name: 'Onyx', gender: 'male' },
        { id: 'nova', name: 'Nova', gender: 'female' },
        { id: 'shimmer', name: 'Shimmer', gender: 'female' },
      ],
    });
  }

  if (provider === 'elevenlabs') {
    return NextResponse.json({
      success: true,
      voices: [
        { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female' },
        { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'female' },
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female' },
        { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'male' },
        { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', gender: 'female' },
        { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', gender: 'male' },
      ],
    });
  }

  return NextResponse.json({ success: false, error: 'Unknown provider' }, { status: 400 });
}
