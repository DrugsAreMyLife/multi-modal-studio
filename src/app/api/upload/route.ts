import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload endpoint - Creates signed upload URLs for media
 * Protected with auth + rate limiting
 */
export async function POST(req: NextRequest) {
  // Require auth + rate limit (10 uploads per minute)
  const authResult = await requireAuthAndRateLimit(req, 'upload', RATE_LIMITS.generation);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { userId } = authResult;

  try {
    const { filename, contentType, folder = 'attachments' } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 });
    }

    const fileExt = filename.split('.').pop();
    const path = `${userId}/${folder}/${uuidv4()}.${fileExt}`;

    const { data, error } = await supabase.storage.from('media').createSignedUploadUrl(path);

    if (error) {
      console.error('Error creating signed upload URL:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      path: path,
      token: data.token,
    });
  } catch (error: any) {
    console.error('Unexpected error in upload route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
