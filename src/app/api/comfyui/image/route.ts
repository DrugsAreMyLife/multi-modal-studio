import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * GET /api/comfyui/image
 * Retrieves generated images from ComfyUI server
 *
 * Query Parameters:
 * - filename (required): The image filename
 * - subfolder (optional): Subfolder where the image is stored (default: '')
 * - type (optional): Image type - 'output', 'input', or 'temp' (default: 'output')
 */
export async function GET(req: NextRequest) {
  // Auth check (no rate limiting for image retrieval)
  const authResult = await requireAuth(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const filename = req.nextUrl.searchParams.get('filename');
  const subfolder = req.nextUrl.searchParams.get('subfolder') || '';
  const type = req.nextUrl.searchParams.get('type') || 'output';

  if (!filename) {
    return NextResponse.json({ error: 'filename parameter is required' }, { status: 400 });
  }

  try {
    // Get ComfyUI server URL from environment
    const comfyUIUrl = process.env.COMFYUI_SERVER_URL;
    if (!comfyUIUrl) {
      console.error('[ComfyUI Image] ComfyUI server URL not configured');
      return NextResponse.json({ error: 'ComfyUI server not configured' }, { status: 500 });
    }

    // Build the image URL
    const params = new URLSearchParams();
    params.append('filename', filename);
    if (subfolder) {
      params.append('subfolder', subfolder);
    }
    params.append('type', type);

    const imageUrl = `${comfyUIUrl}/api/view?${params.toString()}`;

    // Fetch image from ComfyUI
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        Accept: 'image/*',
      },
    });

    if (!response.ok) {
      console.error(
        `[ComfyUI Image] Failed to fetch image: ${response.status} ${response.statusText}`,
      );
      return NextResponse.json(
        {
          error: 'Failed to retrieve image',
          message: `ComfyUI returned ${response.status} ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    // Get the image data
    const imageBlob = await response.blob();

    // Determine content type from response headers or filename
    let contentType = response.headers.get('content-type') || 'application/octet-stream';
    if (contentType === 'application/octet-stream') {
      const ext = filename.split('.').pop()?.toLowerCase();
      contentType =
        ext === 'png'
          ? 'image/png'
          : ext === 'jpg' || ext === 'jpeg'
            ? 'image/jpeg'
            : ext === 'webp'
              ? 'image/webp'
              : ext === 'gif'
                ? 'image/gif'
                : 'application/octet-stream';
    }

    // Return image with caching headers
    return new NextResponse(imageBlob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': imageBlob.size.toString(),
      },
    });
  } catch (error) {
    console.error('[ComfyUI Image] Error retrieving image:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve image',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
