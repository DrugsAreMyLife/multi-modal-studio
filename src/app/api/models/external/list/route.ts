import { NextRequest, NextResponse } from 'next/server';
import { LocalAIClient } from '@/lib/local-ai';
import { ModelProviderId } from '@/lib/models/supported-models';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const baseUrl = searchParams.get('baseUrl');
  const providerId = searchParams.get('providerId') as ModelProviderId;

  if (!baseUrl || !providerId) {
    return NextResponse.json({ error: 'Missing baseUrl or providerId' }, { status: 400 });
  }

  try {
    const client = new LocalAIClient(baseUrl);
    const models = await client.getModels(providerId);
    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch external models' }, { status: 500 });
  }
}
