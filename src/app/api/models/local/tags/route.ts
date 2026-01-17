import { NextRequest, NextResponse } from 'next/server';
import { getInstalledModels } from '@/lib/ollama';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const models = await getInstalledModels();
    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch local models' }, { status: 500 });
  }
}
