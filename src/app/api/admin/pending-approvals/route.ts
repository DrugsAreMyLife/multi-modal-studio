import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { supabase } from '@/lib/db/server';

/**
 * Admin endpoint to list all pending resource approval requests
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/admin/pending-approvals',
    RATE_LIMITS.chat,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  // 1. Verify admin role
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
    // 2. Fetch pending requests
    const { data: requests, error } = await supabase
      .from('admin_approval_requests')
      .select(
        `
        *,
        user:users!user_id (email),
        model:model_registry!model_id (name)
      `,
      )
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error('[AdminAPI] Fetch pending requests error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
