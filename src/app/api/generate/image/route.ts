import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { trackApiUsage, logGeneration } from '@/lib/db/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';

interface ImageGenerationRequest {
  prompt: string;
  provider: 'openai' | 'stability' | 'replicate';
  model?: string;
  width?: number;
  height?: number;
  numImages?: number;
  image?: string; // Base64
  mask?: string; // Base64
}

interface ImageGenerationResponse {
  success: boolean;
  images?: { url: string; seed?: number }[];
  jobId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// Provider adapters
async function generateWithOpenAI(
  prompt: string,
  options: any,
  providedKey?: string,
): Promise<ImageGenerationResponse> {
  const apiKey = providedKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'OpenAI API key not configured' };
  }

  try {
    const isEdit = !!options.image;
    const endpoint = isEdit
      ? 'https://api.openai.com/v1/images/edits'
      : 'https://api.openai.com/v1/images/generations';

    const requestBody: any = {
      prompt,
      n: options.numImages || 1,
      size: `${options.width || 1024}x${options.height || 1024}`,
    };

    if (isEdit) {
      // Dall-E 2 edits require Form Data
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('n', String(options.numImages || 1));
      formData.append('size', `${options.width || 1024}x${options.height || 1024}`);

      // Convert base64 to Blob
      const imageBlob = await fetch(options.image).then((res) => res.blob());
      formData.append('image', imageBlob, 'image.png');

      if (options.mask) {
        const maskBlob = await fetch(options.mask).then((res) => res.blob());
        formData.append('mask', maskBlob, 'mask.png');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error?.message || 'OpenAI Edit error' };
      }

      const data = await response.json();
      return {
        success: true,
        images: data.data.map((img: any) => ({ url: img.url })),
      };
    } else {
      // Normal generation
      requestBody.model = options.model || 'dall-e-3';
      requestBody.quality = 'hd';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error?.message || 'OpenAI API error' };
      }

      const data = await response.json();
      return {
        success: true,
        images: data.data.map((img: any) => ({ url: img.url })),
      };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function generateWithStability(
  prompt: string,
  options: any,
  providedKey?: string,
): Promise<ImageGenerationResponse> {
  const apiKey = providedKey || process.env.STABILITY_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'Stability API key not configured' };
  }

  try {
    const isInpaint = !!options.image && !!options.mask;
    const endpoint = isInpaint
      ? 'https://api.stability.ai/v2beta/stable-image/edit/inpaint'
      : 'https://api.stability.ai/v2beta/stable-image/generate/sd3';

    if (isInpaint) {
      const formData = new FormData();
      formData.append('prompt', prompt);

      const imageBlob = await fetch(options.image).then((res) => res.blob());
      formData.append('image', imageBlob, 'image.png');

      const maskBlob = await fetch(options.mask).then((res) => res.blob());
      formData.append('mask', maskBlob, 'mask.png');

      formData.append('output_format', 'png');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Stability Inpaint error' };
      }

      const data = await response.json();
      return {
        success: true,
        images: [{ url: `data:image/png;base64,${data.image}`, seed: data.seed }],
      };
    } else {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          prompt,
          output_format: 'png',
          aspect_ratio: '1:1',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Stability API error' };
      }

      const data = await response.json();
      return {
        success: true,
        images: [{ url: `data:image/png;base64,${data.image}`, seed: data.seed }],
      };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function generateWithReplicate(
  prompt: string,
  options: any,
  webhookUrl?: string,
  providedKey?: string,
): Promise<ImageGenerationResponse> {
  const apiKey = providedKey || process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    return { success: false, error: 'Replicate API token not configured' };
  }

  try {
    const requestBody: any = {
      version: 'black-forest-labs/flux-schnell',
      input: {
        prompt,
        num_outputs: options.numImages || 1,
      },
    };

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
    '/api/generate/image',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body: ImageGenerationRequest = await req.json();
    const { prompt, provider, ...options } = body;

    // Get keys from headers if provided
    const providedKey = req.headers.get(`x-api-key-${provider}`) || undefined;

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    const webhookUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/webhooks/replicate`;
    let result: ImageGenerationResponse;

    switch (provider) {
      case 'openai':
        result = await generateWithOpenAI(prompt, options, providedKey);
        break;
      case 'stability':
        result = await generateWithStability(prompt, options, providedKey);
        break;
      case 'replicate':
        result = await generateWithReplicate(prompt, options, webhookUrl, providedKey);
        break;
      default:
        result = { success: false, error: `Unknown provider: ${provider}` };
    }

    // Log results and usage if authenticated
    const session = await getSession();
    if (session?.user?.id && (result.success || result.jobId)) {
      const userId = session.user.id;

      // Handle async jobs (like Replicate)
      if (result.jobId) {
        await logGeneration({
          user_id: userId,
          type: 'image',
          prompt,
          model_id: options.model || 'replicate-flux',
          provider,
          status: 'pending',
          provider_job_id: result.jobId,
          metadata: { ...options, webhook_url: webhookUrl },
        });
      }
      // Handle immediate results (like OpenAI/Stability)
      else if (result.images) {
        for (const img of result.images) {
          await logGeneration({
            user_id: userId,
            type: 'image',
            prompt,
            model_id: options.model || 'unknown',
            provider,
            status: 'completed',
            result_url: img.url,
            metadata: { ...options, seed: img.seed },
          });
        }
      }

      // Track usage (Estimated costs)
      let costCents = 0;
      if (provider === 'openai') costCents = (options.numImages || 1) * 4;
      else if (provider === 'stability') costCents = (options.numImages || 1) * 2;
      else if (provider === 'replicate') costCents = (options.numImages || 1) * 1;

      await trackApiUsage({
        user_id: userId,
        provider,
        endpoint: `/api/generate/image`,
        cost_cents: costCents,
      });
    }

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
