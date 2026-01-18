import { NextRequest, NextResponse } from 'next/server';
import { getGenerationByJobId, updateGenerationResult, updateVideoJob } from '@/lib/db/server';

/**
 * Validate webhook signature from provider
 * Implements HMAC-SHA256 signature validation for each provider
 */
function validateWebhookSignature(req: NextRequest, body: string, provider?: string): boolean {
  const signature =
    req.headers.get('x-webhook-signature') ||
    req.headers.get('x-runway-signature') ||
    req.headers.get('x-replicate-signature');

  // In development, allow unsigned webhooks
  if (process.env.NODE_ENV === 'development' && !signature) {
    console.warn('[Webhook] No signature in development mode - allowing');
    return true;
  }

  // In production, require signature
  if (!signature) {
    console.error('[Webhook] Missing signature in production');
    return false;
  }

  let secret: string | undefined;

  // Get the appropriate secret based on provider
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
      console.warn('[Webhook] Unknown provider, using generic secret');
      secret = process.env.WEBHOOK_SECRET;
  }

  if (!secret) {
    console.warn(`[Webhook] No webhook secret configured for ${provider}`);
    return process.env.NODE_ENV === 'development'; // Allow in dev, block in prod
  }

  try {
    // Create HMAC-SHA256 signature
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');

    // Compare signatures (timing-safe)
    const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

    if (!isValid) {
      console.error('[Webhook] Invalid signature', { provider });
    }

    return isValid;
  } catch (error) {
    console.error('[Webhook] Signature validation error:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);
    const { jobId, status, result_url, error, provider } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

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
