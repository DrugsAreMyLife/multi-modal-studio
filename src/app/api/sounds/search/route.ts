import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  // Auth and rate limiting check (using analysis limits for search)
  const authResult = await requireAuthAndRateLimit(req, '/api/sounds/search', RATE_LIMITS.analysis);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const apiKey = process.env.FREESOUND_API_KEY;
  if (!apiKey) {
    // Fail in production to surface config errors
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'FREESOUND_API_KEY not configured' }, { status: 503 });
    }

    // Return mock data in development for testing
    console.warn('FREESOUND_API_KEY not set, returning mock data');
    return NextResponse.json({
      results: [
        {
          id: 123,
          name: 'Mock Sound - Explosion',
          previews: {
            'preview-hq-mp3': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          },
          username: 'DemoUser',
          duration: 12.5,
        },
        {
          id: 124,
          name: 'Mock Sound - Birds',
          previews: {
            'preview-hq-mp3': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          },
          username: 'DemoUser',
          duration: 5.2,
        },
      ],
    });
  }

  try {
    const response = await fetch(
      `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&fields=id,name,previews,username,duration,images&page_size=10`,
      {
        headers: {
          Authorization: `Token ${apiKey}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Freesound API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Sound search error:', error);
    return NextResponse.json({ error: 'Failed to fetch sounds' }, { status: 500 });
  }
}
