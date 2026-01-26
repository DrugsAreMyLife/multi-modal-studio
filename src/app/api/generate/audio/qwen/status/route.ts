import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import {
  getWorkerStatus,
  ensureWorkerReady,
  checkWorkerHealth,
} from '@/lib/workers/local-worker-manager';

/**
 * GET /api/generate/audio/qwen/status
 *
 * Check the status of the Qwen3-TTS worker.
 * Returns whether the worker is running and ready.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio/qwen/status',
    RATE_LIMITS.chat,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const status = getWorkerStatus('qwen-tts');
  const isHealthy = await checkWorkerHealth('qwen-tts');

  return NextResponse.json({
    success: true,
    worker: {
      ...status,
      isHealthy,
    },
  });
}

/**
 * POST /api/generate/audio/qwen/status
 *
 * Start the Qwen3-TTS worker if not running.
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio/qwen/status',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const result = await ensureWorkerReady('qwen-tts');

  if (result.ready) {
    return NextResponse.json({
      success: true,
      message: 'Qwen3-TTS worker is ready',
      worker: getWorkerStatus('qwen-tts'),
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: result.error,
      worker: getWorkerStatus('qwen-tts'),
    },
    { status: 503 },
  );
}
