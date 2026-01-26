import { NextRequest, NextResponse } from 'next/server';
import { getGenerationByJobId, updateGenerationResult, updateVideoJob } from '@/lib/db/server';

import { validateHmacSignature } from '@/lib/webhooks/validation';
import { safeJsonParse, validateUUID } from '@/lib/validation/input-validation';

/**
 * Validate webhook signature from provider
 */
function validateWebhookSignature(req: NextRequest, body: string, provider?: string): boolean {
  const signature =
    req.headers.get('x-webhook-signature') ||
    req.headers.get('x-runway-signature') ||
    req.headers.get('x-luma-signature') ||
    req.headers.get('x-replicate-signature');

  if (!signature) return false;

  if (!signature) return false;

  let secret: string | undefined;
  switch (provider) {
    case 'runway':
      secret = process.env.RUNWAY_WEBHOOK_SECRET;
      break;
    case 'luma':
      secret = process.env.LUMA_WEBHOOK_SECRET;
      break;
    case 'replicate':
      secret = process.env.REPLICATE_WEBHOOK_SECRET;
      break;
    default:
      secret = process.env.WEBHOOK_SECRET;
  }

  return validateHmacSignature(body, signature, secret);
}

export async function POST(req: NextRequest) {
  try {
    const {
      data: body,
      error: parseError,
      statusCode,
    } = await safeJsonParse<{
      jobId: string;
      status: string;
      result_url?: string;
      error?: string;
      provider?: string;
    }>(req);

    if (parseError || !body) {
      return NextResponse.json(
        { error: parseError || 'Invalid request body' },
        { status: statusCode || 400 },
      );
    }

    const { jobId, status, result_url, error, provider } = body;

    if (!jobId || !validateUUID(jobId)) {
      return NextResponse.json({ error: 'Invalid or missing jobId' }, { status: 400 });
    }

    // Reload body text for signature validation (shared with body stream consumption)
    const bodyText = JSON.stringify(body);

    // Validate webhook signature based on provider
    if (!validateWebhookSignature(req, bodyText, provider)) {
      console.error('Invalid webhook signature for provider:', provider);
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // Map status from provider to our internal status
    let internalStatus: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';
    if (status === 'succeeded' || status === 'completed') {
      internalStatus = 'completed';
    } else if (status === 'failed' || status === 'error') {
      internalStatus = 'failed';
    } else if (status === 'processing' || status === 'started') {
      internalStatus = 'processing';
    }

    console.log(`[Webhook] Updated job ${jobId} to ${internalStatus}`, {
      provider,
      resultUrl: result_url ? 'present' : 'missing',
      error: error ? 'present' : 'none',
    });

    // Sync status and results to database (Both tables)
    try {
      // 1. Update Video Jobs
      await updateVideoJob(jobId, {
        status: internalStatus,
        result_url: result_url,
        error: error,
        metadata: {
          provider_status: status,
          updated_at: new Date().toISOString(),
        },
      });

      // 2. Update Generations
      const generation = await getGenerationByJobId(jobId);
      if (generation) {
        await updateGenerationResult(generation.id, {
          status: internalStatus,
          resultUrl: result_url,
          metadata: {
            ...generation.metadata,
            completed_at: internalStatus === 'completed' ? new Date().toISOString() : undefined,
            provider_status: status,
            error: error,
          },
        });
      }
    } catch (dbErr) {
      console.error('Error updating database from webhook:', dbErr);
    }

    return NextResponse.json({ received: true, jobId, status: internalStatus });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// GET endpoint for monitoring webhook health
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
