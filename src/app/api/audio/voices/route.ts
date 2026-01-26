import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  // Auth check
  const authResult = await requireAuth(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    // Return early fallback if no key, so UI doesn't break
    return NextResponse.json({
      voices: [
        { id: 'adam', name: 'Adam (Fallback)', category: 'premade', labels: { gender: 'male' } },
        {
          id: 'rachel',
          name: 'Rachel (Fallback)',
          category: 'premade',
          labels: { gender: 'female' },
        },
      ],
    });
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Map to a cleaner format for our frontend
    const voices = data.voices.map((v: any) => ({
      id: v.voice_id,
      name: v.name,
      category: v.category,
      labels: v.labels,
      preview_url: v.preview_url,
      description: v.description,
    }));

    return NextResponse.json({ success: true, voices });
  } catch (error: any) {
    console.error('Fetch Voices Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
