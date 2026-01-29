import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { trackApiUsage, logGeneration, createVideoJob } from '@/lib/db/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { validatePrompt } from '@/lib/validation/input-validation';
import {
  validateModelId,
  validateModelParameters,
  getProviderForModel,
  resolveModelId,
  getResolvedModel,
} from '@/lib/validation/model-validation';
import { generateWithSora } from '@/lib/providers/video/sora';
import { generateWithVeo } from '@/lib/providers/video/veo';
import { generateWithKling } from '@/lib/providers/video/kling';
import { generateWithPika } from '@/lib/providers/video/pika';
import { generateWithVidu } from '@/lib/providers/video/vidu';
import { generateWithGenmo } from '@/lib/providers/video/genmo';
import { generateWithHaiper } from '@/lib/providers/video/haiper';
import { generateWithFireflyVideo } from '@/lib/providers/video/firefly';
import { batchQueue } from '@/lib/queue/batch-queue';
import { ensureWorkerReady } from '@/lib/workers/local-worker-manager';

interface VideoGenerationRequest {
  prompt: string;
  modelId?: string; // Preferred: model ID from generation-models.ts
  provider?:
    | 'runway'
    | 'luma'
    | 'replicate'
    | 'sora'
    | 'veo'
    | 'kling'
    | 'pika'
    | 'vidu'
    | 'genmo'
    | 'haiper'
    | 'firefly'
    | 'local'; // Legacy: direct provider
  modelParams?: Record<string, any>; // Dynamic parameters from model definition
  imageUrl?: string; // For image-to-video
  endImageUrl?: string; // For keyframe interpolation
  duration?: number;
  webhookUrl?: string; // Optional webhook URL for completion callback
}

interface VideoGenerationResponse {
  success: boolean;
  jobId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}

interface GenerationOptions {
  imageUrl?: string;
  endImageUrl?: string;
  duration?: number;
}

async function generateWithRunway(
  prompt: string,
  options: GenerationOptions,
  webhookUrl?: string,
): Promise<VideoGenerationResponse> {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'Runway API key not configured' };
  }

  try {
    // Runway Gen-3 Alpha API with webhook support
    const requestBody: Record<string, unknown> = {
      promptImage: options.imageUrl,
      promptText: prompt,
      model: 'gen-4-alpha',
      duration: options.duration || 10, // Default to 10s for Gen-4
      ratio: '16:9',
      advanced: {
        camera_motion: 'cinematic',
        motion_bucket: 7,
      },
    };

    // Add webhook if provided
    if (webhookUrl) {
      requestBody.webhook = {
        url: webhookUrl,
      };
    }

    const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Runway API error' };
    }

    const data = await response.json();
    return {
      success: true,
      jobId: data.id,
      status: 'pending',
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function generateWithLuma(
  prompt: string,
  options: GenerationOptions,
  webhookUrl?: string,
): Promise<VideoGenerationResponse> {
  const apiKey = process.env.LUMA_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'Luma API key not configured' };
  }

  try {
    const response = await fetch('https://api.lumalabs.ai/ray/v3/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: '16:9',
        resolution: '4k',
        keyframes: options.imageUrl
          ? {
              frame0: { type: 'image', url: options.imageUrl },
              ...(options.endImageUrl
                ? { frame1: { type: 'image', url: options.endImageUrl } }
                : {}),
            }
          : undefined,
        webhook_url: webhookUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.detail || 'Luma API error' };
    }

    const data = await response.json();
    return {
      success: true,
      jobId: data.id,
      status: 'pending',
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function generateWithReplicate(
  prompt: string,
  options: GenerationOptions,
  webhookUrl?: string,
): Promise<VideoGenerationResponse> {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    return { success: false, error: 'Replicate API token not configured' };
  }

  try {
    const requestBody: Record<string, unknown> = {
      version: 'minimax/video-01', // MiniMax video model
      input: {
        prompt,
        prompt_optimizer: true,
      },
    };

    // Add webhook if provided
    if (webhookUrl) {
      requestBody.webhook = webhookUrl;
      requestBody.webhook_events_filter = ['start', 'completed'];
    }

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.detail || 'Replicate API error' };
    }

    const prediction = await response.json();
    return {
      success: true,
      jobId: prediction.id,
      status: 'pending',
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function POST(req: NextRequest) {
  // Auth and rate limiting check
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/video',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body: VideoGenerationRequest = await req.json();
    const { prompt, modelId, provider: legacyProvider, modelParams, webhookUrl, ...options } = body;

    // Validate prompt
    const promptValidation = validatePrompt(prompt);
    if (!promptValidation.valid) {
      return NextResponse.json({ success: false, error: promptValidation.error }, { status: 400 });
    }

    // Determine provider from modelId or fallback to legacy provider
    let provider: string | null = legacyProvider ?? null;
    let resolvedModelId: string | undefined;
    let validatedParams = { ...options, ...modelParams };

    if (modelId) {
      // Validate and resolve model ID
      const modelValidation = validateModelId(modelId, 'video');
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
        console.warn('[VideoGeneration] Model ID warnings:', modelValidation.warnings);
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
          console.warn('[VideoGeneration] Parameter warnings:', paramValidation.warnings);
        }
      }
    }

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Either modelId or provider is required' },
        { status: 400 },
      );
    }

    // Build webhook URL if not provided - default to our API webhook
    const defaultWebhookUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/webhooks/video`;
    const finalWebhookUrl = webhookUrl || defaultWebhookUrl;

    // Generate video with selected provider
    let result: VideoGenerationResponse;

    switch (provider) {
      case 'runway':
        result = await generateWithRunway(prompt, validatedParams, finalWebhookUrl);
        break;
      case 'luma':
        result = await generateWithLuma(prompt, validatedParams, finalWebhookUrl);
        break;
      case 'replicate':
        result = await generateWithReplicate(prompt, validatedParams, finalWebhookUrl);
        break;
      case 'sora':
      case 'openai':
        result = await generateWithSora(prompt, validatedParams);
        break;
      case 'veo':
      case 'google':
        result = await generateWithVeo(prompt, validatedParams);
        break;
      case 'kling':
      case 'kuaishou':
        result = await generateWithKling(prompt, validatedParams);
        break;
      case 'pika':
        result = await generateWithPika(prompt, validatedParams);
        break;
      case 'vidu':
      case 'shengshu':
        result = await generateWithVidu(prompt, validatedParams);
        break;
      case 'genmo':
        result = await generateWithGenmo(prompt, validatedParams);
        break;
      case 'haiper':
        result = await generateWithHaiper(prompt, validatedParams);
        break;
      case 'firefly':
      case 'adobe':
        result = await generateWithFireflyVideo(prompt, validatedParams);
        break;
      case 'local':
      case 'stability':
        // Handle local video models
        const localModelId = resolvedModelId || (modelParams?.model as string) || 'hunyuan-video';
        const workerReady = await ensureWorkerReady(localModelId as any);
        if (!workerReady.ready) {
          return NextResponse.json({ success: false, error: workerReady.error }, { status: 503 });
        }

        const job = await batchQueue.add('generation', {
          model_id: localModelId,
          payload: { prompt, ...validatedParams },
        });

        result = { success: true, jobId: job.id, status: 'pending' as const };
        break;
      default:
        result = { success: false, error: `Unknown provider: ${provider}` };
    }

    if (!result.success || !result.jobId) {
      return NextResponse.json(result, { status: 500 });
    }

    // Register job in database with pending status
    const session = await getSession();
    const userId = session?.user?.id;
    if (userId) {
      await createVideoJob({
        user_id: userId,
        provider,
        provider_job_id: result.jobId,
        prompt,
        metadata: {
          model_id: resolvedModelId,
          image_url: validatedParams.imageUrl,
          duration: validatedParams.duration,
          webhook_url: finalWebhookUrl,
          model_params: modelParams,
        },
      });

      // Track usage (Estimated costs based on model/provider)
      const modelDef = resolvedModelId ? getResolvedModel(resolvedModelId) : null;
      let costCents = 0;
      if (modelDef?.pricing?.perGeneration) {
        costCents = Math.round(modelDef.pricing.perGeneration * 100);
      } else if (provider === 'runway') costCents = 20;
      else if (provider === 'luma') costCents = 15;
      else if (provider === 'replicate') costCents = 10;
      else if (provider === 'local' || provider === 'stability') costCents = 0;

      await trackApiUsage({
        user_id: userId,
        provider,
        endpoint: `/api/generate/video`,
        cost_cents: costCents,
      });
    }

    console.log(`[VideoGeneration] Started job ${result.jobId}`, {
      modelId: resolvedModelId,
      provider,
      prompt: prompt.substring(0, 50) + '...',
    });

    return NextResponse.json(
      {
        success: true,
        jobId: result.jobId,
        modelId: resolvedModelId,
        provider,
        status: 'pending',
        message: 'Video generation started. Use jobId to check status.',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
