import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { approvalService } from '@/lib/admin/approval-service';
import { supabase } from '@/lib/db/server';

export async function POST(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(req, '/api/admin/approve', RATE_LIMITS.chat);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  // 1. Check if user is admin
  const { data: user } = await supabase
    .from('users')
    .select('settings_json')
    .eq('id', authResult.userId)
    .single();

  const isAdmin = (user?.settings_json as any)?.is_admin === true;
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin only' },
      { status: 403 },
    );
  }

  try {
    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json({ success: false, error: 'Missing requestId' }, { status: 400 });
    }

    const result = await approvalService.approveRequest(requestId, authResult.userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[AdminAPI] Approval error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
