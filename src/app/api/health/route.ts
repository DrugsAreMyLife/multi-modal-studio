import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/server';
import { redis } from '@/lib/redis';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  // Require authentication for internal monitoring
  const authResult = await requireAuth(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const status: Record<string, any> = {
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      database: 'pending',
      redis: 'pending',
    },
  };

  try {
    // Check Database
    const { error: dbError } = await supabase.from('users').select('id').limit(1);
    status.services.database = dbError ? 'error' : 'ok';

    // Check Redis
    if (redis) {
      try {
        await redis.ping();
        status.services.redis = 'ok';
      } catch (e) {
        status.services.redis = 'error';
      }
    } else {
      status.services.redis = 'not_configured';
    }

    const overallOk = Object.values(status.services).every(
      (s) => s === 'ok' || s === 'not_configured',
    );

    return NextResponse.json(status, { status: overallOk ? 200 : 503 });
  } catch (error: any) {
    // Redact error details in production
    const errorMessage = process.env.NODE_ENV === 'development' ? error.message : 'Internal error';
    return NextResponse.json(
      {
        status: 'critical_failure',
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
