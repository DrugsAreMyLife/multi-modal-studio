import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { trackApiUsage, logGeneration } from '@/lib/db/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { validatePrompt } from '@/lib/validation/input-validation';
import {
  validateModelId,
  validateModelParameters,
  getProviderForModel,
  resolveModelId,
  getResolvedModel,
} from '@/lib/validation/model-validation';
import { generateWithFluxMax } from '@/lib/providers/image/flux-max';
import { generateWithMidjourney } from '@/lib/providers/image/midjourney';
import { generateWithIdeogram } from '@/lib/providers/image/ideogram';
import { comfyUIRouter } from '@/lib/comfyui/workflow-router';
import { batchQueue } from '@/lib/queue/batch-queue';
import { ensureWorkerReady } from '@/lib/workers/local-worker-manager';

interface ImageGenerationRequest {
  prompt: string;
  modelId?: string; // Preferred: model ID from generation-models.ts
  provider?:
    | 'openai'
    | 'stability'
    | 'replicate'
    | 'flux-max'
    | 'midjourney'
    | 'ideogram'
    | 'comfyui'
    | 'local'; // Legacy: direct provider
  modelParams?: Record<string, any>; // Dynamic parameters from model definition
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
      requestBody.model = options.model || 'gpt-image-1.5';
      requestBody.quality = options.quality || 'hd';

      // SOTA 2026 Features
      if (options.controlled_design) {
        requestBody.controlled_design = options.controlled_design;
      }
      if (options.text_precision) {
        requestBody.text_precision = options.text_precision;
      }

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
    const { prompt, modelId, provider: legacyProvider, modelParams, ...options } = body;

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
      const modelValidation = validateModelId(modelId, 'image');
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
        console.warn('[ImageGeneration] Model ID warnings:', modelValidation.warnings);
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
          console.warn('[ImageGeneration] Parameter warnings:', paramValidation.warnings);
        }
      }
    }

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Either modelId or provider is required' },
        { status: 400 },
      );
    }

    // Get keys from headers if provided
    const providedKey = req.headers.get(`x-api-key-${provider}`) || undefined;

    const webhookUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/webhooks/replicate`;
    let result: ImageGenerationResponse;

    switch (provider) {
      case 'openai':
        result = await generateWithOpenAI(prompt, validatedParams, providedKey);
        break;
      case 'stability':
        result = await generateWithStability(prompt, validatedParams, providedKey);
        break;
      case 'replicate':
        result = await generateWithReplicate(prompt, validatedParams, webhookUrl, providedKey);
        break;
      case 'flux-max':
      case 'bfl':
        result = await generateWithFluxMax({ prompt, ...validatedParams }, providedKey, webhookUrl);
        break;
      case 'midjourney':
        result = await generateWithMidjourney(prompt, providedKey);
        break;
      case 'ideogram':
        result = await generateWithIdeogram(prompt, providedKey);
        break;
      case 'comfyui':
        result = await comfyUIRouter.executeWorkflow(
          (modelParams?.workflow as string) || 'default',
          { prompt, ...validatedParams },
        );
        break;
      case 'local':
      case 'qwen':
      case 'hunyuan':
      case 'meta':
      case 'deepseek':
        // Handle local workers via Batch Queue
        const localModelId = resolvedModelId || validatedParams.model;
        const workerId =
          localModelId === 'qwen-image'
            ? 'qwen-image'
            : localModelId === 'hunyuan-image'
              ? 'hunyuan-image'
              : localModelId === 'sam-2'
                ? 'sam2'
                : localModelId === 'deepseek-janus-pro-7b'
                  ? 'deepseek-janus'
                  : null;

        if (workerId) {
          const workerReady = await ensureWorkerReady(workerId as any);
          if (!workerReady.ready) {
            return NextResponse.json({ success: false, error: workerReady.error }, { status: 503 });
          }

          const job = await batchQueue.add('generation', {
            model_id: localModelId,
            payload: { prompt, ...validatedParams },
          });

          result = { success: true, jobId: job.id, status: 'pending' as const };
        } else {
          result = { success: false, error: `Unsupported local model: ${localModelId}` };
        }
        break;
      default:
        result = { success: false, error: `Unknown provider: ${provider}` };
    }

    // Log results and usage if authenticated
    const session = await getSession();
    if (session?.user?.id && (result.success || result.jobId)) {
      const userId = session.user.id;
      const effectiveModelId = resolvedModelId || validatedParams.model || 'unknown';

      // Handle async jobs (like Replicate)
      if (result.jobId) {
        await logGeneration({
          user_id: userId,
          type: 'image',
          prompt,
          model_id: effectiveModelId,
          provider,
          status: 'pending',
          provider_job_id: result.jobId,
          metadata: { ...validatedParams, model_params: modelParams, webhook_url: webhookUrl },
        });
      }
      // Handle immediate results (like OpenAI/Stability)
      else if (result.images) {
        for (const img of result.images) {
          await logGeneration({
            user_id: userId,
            type: 'image',
            prompt,
            model_id: effectiveModelId,
            provider,
            status: 'completed',
            result_url: img.url,
            metadata: { ...validatedParams, model_params: modelParams, seed: img.seed },
          });
        }
      }

      // Track usage (Estimated costs based on model/provider)
      const modelDef = resolvedModelId ? getResolvedModel(resolvedModelId) : null;
      const numImages = validatedParams.numImages || 1;
      let costCents = 0;
      if (modelDef?.pricing?.perGeneration) {
        costCents = Math.round(modelDef.pricing.perGeneration * 100 * numImages);
      } else if (provider === 'openai') costCents = numImages * 4;
      else if (provider === 'stability') costCents = numImages * 2;
      else if (provider === 'replicate') costCents = numImages * 1;
      else if (
        provider === 'local' ||
        provider === 'qwen' ||
        provider === 'hunyuan' ||
        provider === 'deepseek'
      )
        costCents = 0;

      await trackApiUsage({
        user_id: userId,
        provider,
        endpoint: `/api/generate/image`,
        cost_cents: costCents,
      });
    }

    console.log(`[ImageGeneration] Completed`, {
      modelId: resolvedModelId,
      provider,
      success: result.success,
      jobId: result.jobId,
    });

    return NextResponse.json(
      { ...result, modelId: resolvedModelId, provider },
      { status: result.success ? 200 : 500 },
    );
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
