import { NextRequest, NextResponse } from 'next/server';
import { getGenerationByJobId, updateGenerationResult } from '@/lib/db/server';
import crypto from 'crypto';

/**
 * Validate Replicate webhook signature
 */
function validateSignature(req: NextRequest, body: string): boolean {
  const signature = req.headers.get('x-replicate-signature');
  const secret = process.env.REPLICATE_WEBHOOK_SECRET;

  if (process.env.NODE_ENV === 'development' && !signature) {
    return true;
  }

  if (!signature || !secret) {
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const expected = hmac.digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch (e) {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const body = JSON.parse(bodyText);

  // Replicate webhook payload structure: { id, status, output, error, ... }
  const { id: jobId, status, output, error } = body;

  if (!validateSignature(req, bodyText)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const generation = await getGenerationByJobId(jobId);
    if (!generation) {
      console.warn(`[Replicate Webhook] No generation found for job ${jobId}`);
      return NextResponse.json({ received: true });
    }

    let internalStatus: 'pending' | 'processing' | 'completed' | 'failed' = 'processing';
    if (status === 'succeeded') internalStatus = 'completed';
    else if (status === 'failed' || status === 'canceled') internalStatus = 'failed';
    else if (status === 'starting' || status === 'processing') internalStatus = 'processing';

    const resultUrl = Array.isArray(output) ? output[0] : output;

    await updateGenerationResult(generation.id, {
      status: internalStatus,
      resultUrl: internalStatus === 'completed' ? resultUrl : undefined,
      metadata: {
        ...generation.metadata,
        replicate_status: status,
        error: error || undefined,
        completed_at: internalStatus === 'completed' ? new Date().toISOString() : undefined,
      },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Replicate Webhook] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
