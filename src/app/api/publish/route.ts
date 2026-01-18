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

      // SSRF Protection: Validate webhook URL
      try {
        const url = new URL(webhookUrl);
        if (url.protocol !== 'https:') {
          return NextResponse.json({ error: 'Invalid webhook protocol' }, { status: 400 });
        }
        if (!url.hostname.endsWith('.slack.com') && !url.hostname.endsWith('.hooks.slack.com')) {
          // Allow internal or specific debug URLs only in development
          if (process.env.NODE_ENV !== 'development') {
            return NextResponse.json({ error: 'Invalid webhook host' }, { status: 400 });
          }
        }
      } catch (e) {
        return NextResponse.json({ error: 'Malformed webhook URL' }, { status: 400 });
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
