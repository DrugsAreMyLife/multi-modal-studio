import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { trackApiUsage, logGeneration } from '@/lib/db/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { validatePrompt } from '@/lib/validation/input-validation';
import { generateWithRecraft } from '@/lib/providers/icon/recraft';
import { generateWithFireflyVector } from '@/lib/providers/icon/firefly-vector';
import { comfyUIRouter } from '@/lib/comfyui/workflow-router';
import { batchQueue } from '@/lib/queue/batch-queue';
import { ensureWorkerReady } from '@/lib/workers/local-worker-manager';

export async function POST(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/icon',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await req.json();
    const { prompt, provider, ...options } = body;

    const validation = validatePrompt(prompt);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    let result: any;

    switch (provider) {
      case 'recraft':
        result = await generateWithRecraft(prompt);
        break;
      case 'firefly-vector':
        result = await generateWithFireflyVector(prompt);
        break;
      case 'comfyui':
        result = await comfyUIRouter.executeWorkflow('icon-lora', { prompt, ...options });
        break;
      case 'local':
        if (options.model === 'svg-turbo') {
          const workerReady = await ensureWorkerReady('svg-turbo' as any);
          if (!workerReady.ready) {
            return NextResponse.json({ success: false, error: workerReady.error }, { status: 503 });
          }
          const job = await batchQueue.add('generation', {
            model_id: 'local/svg-turbo',
            payload: { prompt },
          });
          result = { success: true, jobId: job.id, status: 'pending' };
        } else {
          result = { success: false, error: 'Unknown local icon model' };
        }
        break;
      default:
        result = { success: false, error: `Unknown provider: ${provider}` };
    }

    // Log and track
    const session = await getSession();
    if (session?.user?.id && (result.success || result.jobId)) {
      await logGeneration({
        user_id: session.user.id,
        type: 'image', // Icons are stored as image types for now
        prompt,
        model_id: options.model || provider,
        provider,
        status: result.jobId ? 'pending' : 'completed',
        result_url: result.images?.[0]?.url,
        provider_job_id: result.jobId,
        metadata: options,
      });

      await trackApiUsage({
        user_id: session.user.id,
        provider,
        endpoint: '/api/generate/icon',
        cost_cents: 5,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
