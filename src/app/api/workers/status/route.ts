import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import {
  getAllWorkerStatuses,
  getWorkerStatus,
  ensureWorkerReady,
  stopWorker,
  resetWorkerState,
  getActiveVramUsage,
  LocalWorkerId,
  WORKER_CONFIGS,
} from '@/lib/workers/local-worker-manager';

/**
 * GET /api/workers/status
 *
 * Get status of all local workers or a specific worker.
 * Query params:
 * - workerId: specific worker to check (optional)
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(req, '/api/workers/status', RATE_LIMITS.chat);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const workerId = req.nextUrl.searchParams.get('workerId') as LocalWorkerId | null;

  if (workerId) {
    if (!WORKER_CONFIGS[workerId]) {
      return NextResponse.json(
        { success: false, error: `Unknown worker: ${workerId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      success: true,
      worker: getWorkerStatus(workerId),
    });
  }

  return NextResponse.json({
    success: true,
    workers: getAllWorkerStatuses(),
    activeVram: getActiveVramUsage(),
  });
}

/**
 * POST /api/workers/status
 *
 * Start or stop a worker.
 * Body:
 * - workerId: worker to control (required)
 * - action: 'start' | 'stop' | 'restart' (required)
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/workers/status',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { workerId, action } = await req.json();

    if (!workerId || !WORKER_CONFIGS[workerId as LocalWorkerId]) {
      return NextResponse.json(
        { success: false, error: `Unknown worker: ${workerId}` },
        { status: 400 },
      );
    }

    const id = workerId as LocalWorkerId;

    switch (action) {
      case 'start': {
        const result = await ensureWorkerReady(id);
        if (result.ready) {
          return NextResponse.json({
            success: true,
            message: `${WORKER_CONFIGS[id].label} is ready`,
            worker: getWorkerStatus(id),
          });
        }
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            worker: getWorkerStatus(id),
          },
          { status: 503 },
        );
      }

      case 'stop': {
        stopWorker(id);
        return NextResponse.json({
          success: true,
          message: `${WORKER_CONFIGS[id].label} stopped`,
          worker: getWorkerStatus(id),
        });
      }

      case 'restart': {
        resetWorkerState(id);
        const result = await ensureWorkerReady(id);
        if (result.ready) {
          return NextResponse.json({
            success: true,
            message: `${WORKER_CONFIGS[id].label} restarted`,
            worker: getWorkerStatus(id),
          });
        }
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            worker: getWorkerStatus(id),
          },
          { status: 503 },
        );
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('[Workers API] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
