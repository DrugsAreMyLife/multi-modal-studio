import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { approvalService } from '@/lib/admin/approval-service';

export async function POST(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/admin/request-approval',
    RATE_LIMITS.chat,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { modelId, nodeId, reason } = await req.json();

    if (!modelId || !nodeId) {
      return NextResponse.json(
        { success: false, error: 'Missing modelId or nodeId' },
        { status: 400 },
      );
    }

    const result = await approvalService.requestUsage({
      userId: authResult.userId,
      modelId,
      nodeId,
      reason,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[AdminAPI] Request error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
