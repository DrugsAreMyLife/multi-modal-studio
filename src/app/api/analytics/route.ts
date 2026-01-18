import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { supabase } from '@/lib/db/server';

export async function GET(req: NextRequest) {
  // Auth and rate limiting check
  const authResult = await requireAuthAndRateLimit(req, '/api/analytics', RATE_LIMITS.chat);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { userId } = authResult;

  try {
    // 1. Fetch usage data
    const { data: usage, error: usageError } = await supabase
      .from('api_usage')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (usageError) throw usageError;

    // 2. Fetch generation data
    const { data: generations, error: genError } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (genError) throw genError;

    // 3. Aggregate data for charts (By Day)
    const dailyStats: Record<string, { date: string; cost: number; count: number }> = {};

    (usage || []).forEach((entry) => {
      const date = new Date(entry.created_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { date, cost: 0, count: 0 };
      }
      dailyStats[date].cost += (entry.cost_cents || 0) / 100;
      dailyStats[date].count += 1;
    });

    // 4. Aggregate by Provider
    const providerStats: Record<string, { provider: string; cost: number; count: number }> = {};
    (usage || []).forEach((entry) => {
      const p = entry.provider;
      if (!providerStats[p]) {
        providerStats[p] = { provider: p, cost: 0, count: 0 };
      }
      providerStats[p].cost += (entry.cost_cents || 0) / 100;
      providerStats[p].count += 1;
    });

    // 5. Generation Type Stats
    const typeStats: Record<string, number> = {
      image: 0,
      video: 0,
      audio: 0,
    };
    (generations || []).forEach((gen) => {
      if (typeStats[gen.type] !== undefined) {
        typeStats[gen.type]++;
      }
    });

    return NextResponse.json({
      summary: {
        totalCost: (usage || []).reduce((sum, e) => sum + (e.cost_cents || 0), 0) / 100,
        totalGenerations: (generations || []).length,
        topProvider:
          Object.values(providerStats).sort((a, b) => b.cost - a.cost)[0]?.provider || 'None',
      },
      dailyData: Object.values(dailyStats),
      providerData: Object.values(providerStats),
      typeData: Object.entries(typeStats).map(([name, value]) => ({ name, value })),
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
