import { NextRequest, NextResponse } from 'next/server';
import { getGenerationByJobId, updateGenerationResult } from '@/lib/db/server';
import { validateReplicateWebhook } from '@/lib/webhooks/validation';
import { safeJsonParse, validateUUID } from '@/lib/validation/input-validation';

// Custom validation logic replaced by validateReplicateWebhook helper

export async function POST(req: NextRequest) {
  const {
    data: body,
    error: parseError,
    statusCode,
  } = await safeJsonParse<{
    id: string;
    status: string;
    output?: any;
    error?: string;
  }>(req);

  if (parseError || !body) {
    return NextResponse.json(
      { error: parseError || 'Invalid request body' },
      { status: statusCode || 400 },
    );
  }

  // Replicate webhook payload structure: { id, status, output, error, ... }
  const { id: jobId, status, output, error } = body;

  if (!jobId || !validateUUID(jobId)) {
    return NextResponse.json({ error: 'Invalid or missing jobId' }, { status: 400 });
  }

  // Validate signature (Svix-standard HMAC-SHA256)
  const isValid = await validateReplicateWebhook(
    req,
    process.env.REPLICATE_WEBHOOK_SIGNING_SECRET || process.env.REPLICATE_WEBHOOK_SECRET,
  );

  if (!isValid) {
    console.error(`[Replicate Webhook] Signature validation failed for job ${jobId}`);
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
