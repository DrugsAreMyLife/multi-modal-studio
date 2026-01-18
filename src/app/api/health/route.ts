import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/server';
import { redis } from '@/lib/redis';

export async function GET() {
  const status: Record<string, any> = {
    uptime: process.uptime(),
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
    if (dbError) status.services.database_detail = dbError.message;

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
    return NextResponse.json(
      {
        status: 'critical_failure',
        error: error.message,
      },
      { status: 500 },
    );
  }
}
