import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  // Auth and rate limiting check (using chat limits as publishing is an action)
  const authResult = await requireAuthAndRateLimit(req, '/api/publish', RATE_LIMITS.chat);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { service, message, attachments, metadata } = await req.json();

    if (service === 'slack') {
      const webhookUrl = req.headers.get('x-api-key-slack');
      if (!webhookUrl) {
        return NextResponse.json({ error: 'Slack Webhook URL is missing' }, { status: 400 });
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          blocks: attachments?.map((url: string) => ({
            type: 'image',
            image_url: url,
            alt_text: 'Generated Content',
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unsupported service' }, { status: 400 });
  } catch (error: any) {
    console.error('Publishing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
