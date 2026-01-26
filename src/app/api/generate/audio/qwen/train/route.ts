import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { trackApiUsage } from '@/lib/db/server';
import { ensureWorkerReady, getWorkerUrl } from '@/lib/workers/local-worker-manager';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/generate/audio/qwen/train
 *
 * Start a voice training job with uploaded audio samples.
 * Creates a LoRA fine-tune of Qwen3-TTS-Base for custom voice cloning.
 *
 * Request body (multipart/form-data):
 * - name: string - Name for the trained voice
 * - language: string - Primary language of the training data
 * - samples: File[] - Audio files (5-50 files, 5-60s each)
 * - transcripts: string[] - Transcripts for each audio file (JSON array)
 */
export async function POST(req: NextRequest) {
  // Auth and rate limiting (use stricter limits for training)
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio/qwen/train',
    { maxRequests: 5, windowMs: 3600000 }, // 5 training jobs per hour
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userId = authResult.userId;

  try {
    const formData = await req.formData();

    const name = formData.get('name') as string;
    const language = formData.get('language') as string;
    const transcriptsJson = formData.get('transcripts') as string;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Voice name is required' },
        { status: 400 },
      );
    }

    // Parse transcripts
    let transcripts: string[];
    try {
      transcripts = JSON.parse(transcriptsJson);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid transcripts format. Expected JSON array.' },
        { status: 400 },
      );
    }

    // Collect audio files
    const audioFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('sample_') && value instanceof File) {
        audioFiles.push(value);
      }
    }

    // Validate sample count
    if (audioFiles.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Minimum 5 audio samples required for training' },
        { status: 400 },
      );
    }

    if (audioFiles.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum 50 audio samples allowed' },
        { status: 400 },
      );
    }

    // Validate transcript count matches
    if (transcripts.length !== audioFiles.length) {
      return NextResponse.json(
        {
          success: false,
          error: `Transcript count (${transcripts.length}) must match sample count (${audioFiles.length})`,
        },
        { status: 400 },
      );
    }

    // Create job ID
    const jobId = uuidv4();

    // Build FormData for Python worker
    const workerFormData = new FormData();
    workerFormData.append('job_id', jobId);
    workerFormData.append('name', name);
    workerFormData.append('language', language);
    workerFormData.append('user_id', userId);
    workerFormData.append('transcripts', transcriptsJson);
    workerFormData.append(
      'webhook_url',
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/qwen/training`,
    );

    audioFiles.forEach((file, index) => {
      workerFormData.append(`sample_${index}`, file);
    });

    // Ensure Qwen3-TTS worker is running
    const workerStatus = await ensureWorkerReady('qwen-tts');
    if (!workerStatus.ready) {
      return NextResponse.json(
        {
          success: false,
          error: `Qwen3-TTS worker failed to start: ${workerStatus.error}`,
          workerError: true,
        },
        { status: 503 },
      );
    }

    // Send to Python worker
    const workerUrl = getWorkerUrl('qwen-tts');
    const response = await fetch(`${workerUrl}/train`, {
      method: 'POST',
      body: workerFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Qwen3-TTS Train] Worker error:', errorText);
      return NextResponse.json(
        { success: false, error: `Training failed to start: ${errorText}` },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Track usage
    await trackApiUsage({
      user_id: userId,
      provider: 'qwen-tts',
      endpoint: '/api/generate/audio/qwen/train',
      cost_cents: 0, // Local training, no API cost
    });

    return NextResponse.json({
      success: true,
      jobId,
      name,
      status: 'pending',
      progress: 0,
      datasetSize: audioFiles.length,
      createdAt: Date.now(),
      message: 'Training job started. Poll for status updates.',
    });
  } catch (error) {
    console.error('[Qwen3-TTS Train] Error:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Qwen3-TTS worker connection failed. The worker may need Python dependencies installed.',
          workerError: true,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

/**
 * GET /api/generate/audio/qwen/train?jobId=xxx
 *
 * Get the status of a training job.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio/qwen/train',
    RATE_LIMITS.chat,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const jobId = req.nextUrl.searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { success: false, error: 'jobId query parameter is required' },
      { status: 400 },
    );
  }

  try {
    // For status checks, just use the worker URL without ensuring it's running
    // If it's not running, the job status is effectively "unknown"
    const workerUrl = getWorkerUrl('qwen-tts');
    const response = await fetch(`${workerUrl}/train/status?job_id=${jobId}`);

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error('[Qwen3-TTS Train Status] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
