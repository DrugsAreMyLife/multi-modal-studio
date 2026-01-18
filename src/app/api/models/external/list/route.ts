import { NextRequest, NextResponse } from 'next/server';
import { LocalAIClient } from '@/lib/local-ai';
import { ModelProviderId } from '@/lib/models/supported-models';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
  if (host.endsWith('.local')) return true;

  const ipv4Match = host.match(/^(\d{1,3}\.){3}\d{1,3}$/);
  if (ipv4Match) {
    const parts = host.split('.').map((part) => Number(part));
    if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return true;
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }

  return false;
}

function validateBaseUrl(baseUrl: string): { ok: true } | { ok: false; error: string } {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return { ok: false, error: 'Invalid baseUrl' };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, error: 'Invalid protocol' };
  }

  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    return { ok: false, error: 'HTTPS is required in production' };
  }

  const allowlist = (process.env.ALLOWED_EXTERNAL_MODEL_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  const hostname = url.hostname.toLowerCase();
  if (allowlist.length > 0) {
    if (!allowlist.includes(hostname)) {
      return { ok: false, error: 'Host is not allowlisted' };
    }
  } else if (isPrivateHostname(hostname)) {
    return { ok: false, error: 'Private or local hosts are not allowed' };
  }

  return { ok: true };
}

export async function GET(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/models/external/list',
    RATE_LIMITS.analysis,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const searchParams = req.nextUrl.searchParams;
  const baseUrl = searchParams.get('baseUrl');
  const providerId = searchParams.get('providerId') as ModelProviderId;

  if (!baseUrl || !providerId) {
    return NextResponse.json({ error: 'Missing baseUrl or providerId' }, { status: 400 });
  }

  const validation = validateBaseUrl(baseUrl);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const client = new LocalAIClient(baseUrl);
    const models = await client.getModels(providerId);
    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch external models' }, { status: 500 });
  }
}
