import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/webhooks/qwen/training
 *
 * Webhook endpoint for Qwen3-TTS training progress updates.
 * Called by the Python worker during training.
 *
 * Request body:
 * - job_id: string - The training job ID
 * - status: 'pending' | 'uploading' | 'training' | 'completed' | 'failed'
 * - progress: number - Progress percentage (0-100)
 * - model_path?: string - Path to trained LoRA (on completion)
 * - error?: string - Error message (on failure)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature (optional security)
    const signature = req.headers.get('x-webhook-signature');
    const expectedSignature = process.env.QWEN_WEBHOOK_SECRET;

    if (expectedSignature && signature !== expectedSignature) {
      console.error('[Qwen Training Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = await req.json();

    const { job_id, status, progress, model_path, error, user_id } = body;

    if (!job_id) {
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
    }

    console.log(`[Qwen Training Webhook] Job ${job_id}: ${status} (${progress}%)`);

    // In a production app, you would:
    // 1. Update the job status in a database
    // 2. Send a real-time notification via WebSocket or Server-Sent Events
    // 3. Optionally email the user on completion/failure

    // For now, we'll log and return success
    // The frontend polls /api/generate/audio/qwen/train?jobId=xxx for updates

    if (status === 'completed' && model_path) {
      console.log(`[Qwen Training Webhook] Training complete! Model saved to: ${model_path}`);
      // TODO: Store model_path in database associated with user_id
    }

    if (status === 'failed' && error) {
      console.error(`[Qwen Training Webhook] Training failed: ${error}`);
      // TODO: Log failure in database, possibly notify user
    }

    return NextResponse.json({
      success: true,
      received: {
        job_id,
        status,
        progress,
        model_path,
      },
    });
  } catch (error) {
    console.error('[Qwen Training Webhook] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
