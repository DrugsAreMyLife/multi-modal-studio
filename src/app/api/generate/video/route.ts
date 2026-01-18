import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { trackApiUsage, logGeneration, createVideoJob } from '@/lib/db/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';

interface VideoGenerationRequest {
  prompt: string;
  provider: 'runway' | 'luma' | 'replicate';
  imageUrl?: string; // For image-to-video
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
      model: 'gen3a_turbo',
      duration: options.duration || 5,
      ratio: '16:9',
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
    const requestBody: Record<string, unknown> = {
      prompt,
      aspect_ratio: '16:9',
      loop: false,
      keyframes: options.imageUrl
        ? {
            frame0: { type: 'image', url: options.imageUrl },
          }
        : undefined,
    };

    // Add webhook if provided
    if (webhookUrl) {
      requestBody.webhook_url = webhookUrl;
    }

    const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
    const { prompt, provider, webhookUrl, ...options } = body;

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    if (!provider) {
      return NextResponse.json({ success: false, error: 'Provider is required' }, { status: 400 });
    }

    // Build webhook URL if not provided - default to our API webhook
    const defaultWebhookUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/webhooks/video`;
    const finalWebhookUrl = webhookUrl || defaultWebhookUrl;

    // Generate video with selected provider
    let result: VideoGenerationResponse;

    switch (provider) {
      case 'runway':
        result = await generateWithRunway(prompt, options, finalWebhookUrl);
        break;
      case 'luma':
        result = await generateWithLuma(prompt, options, finalWebhookUrl);
        break;
      case 'replicate':
        result = await generateWithReplicate(prompt, options, finalWebhookUrl);
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
          image_url: options.imageUrl,
          duration: options.duration,
          webhook_url: finalWebhookUrl,
        },
      });

      // Track usage (Estimated costs)
      let costCents = 0;
      if (provider === 'runway') costCents = 20;
      else if (provider === 'luma') costCents = 15;
      else if (provider === 'replicate') costCents = 10;

      await trackApiUsage({
        user_id: userId,
        provider,
        endpoint: `/api/generate/video`,
        cost_cents: costCents,
      });
    }

    console.log(`[VideoGeneration] Started job ${result.jobId}`, {
      provider,
      prompt: prompt.substring(0, 50) + '...',
    });

    return NextResponse.json(
      {
        success: true,
        jobId: result.jobId,
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
