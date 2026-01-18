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

  // SSRF Protection: Validate baseUrl
  try {
    const url = new URL(baseUrl);

    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 });
    }

    // Block private IP ranges and localhost
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
      hostname === '0.0.0.0' ||
      hostname === '::1'
    ) {
      // Allow localhost only in development
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Private IP addresses not allowed' }, { status: 400 });
      }
    }
  } catch (e) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const client = new LocalAIClient(baseUrl);
    const models = await client.getModels(providerId);
    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch external models' }, { status: 500 });
  }
}
