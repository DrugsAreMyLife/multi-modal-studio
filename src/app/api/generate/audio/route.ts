import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { trackApiUsage } from '@/lib/db/server';

interface AudioGenerationRequest {
  text: string;
  provider: 'elevenlabs' | 'openai';
  voiceId?: string;
  model?: string;
}

interface AudioGenerationResponse {
  success: boolean;
  audioUrl?: string;
  audioBase64?: string;
  error?: string;
}
async function generateWithElevenLabs(text: string, options: any): Promise<Response> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  const voiceId = options.voiceId || '21m00Tcm4TlvDq8ikWAM';
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: options.model || 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  return response;
}

async function generateWithOpenAI(text: string, options: any): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'tts-1-hd',
      input: text,
      voice: options.voiceId || 'alloy',
      response_format: 'mp3',
    }),
  });

  return response;
}

export async function POST(req: NextRequest) {
  // Auth and rate limiting check
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userId = authResult.userId;

  try {
    const body: AudioGenerationRequest = await req.json();
    const { text, provider, ...options } = body;

    if (!text) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
    }

    let response: Response;

    switch (provider) {
      case 'elevenlabs':
        response = await generateWithElevenLabs(text, options);
        break;
      case 'openai':
        response = await generateWithOpenAI(text, options);
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Unknown provider: ${provider}` },
          { status: 400 },
        );
    }

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { success: false, error: `Upstream error: ${error}` },
        { status: response.status },
      );
    }

    // Track usage (Estimated costs based on characters)
    let costCents = 1;
    if (provider === 'elevenlabs') costCents = Math.max(1, Math.ceil(text.length * 0.005));
    else if (provider === 'openai') costCents = Math.max(1, Math.ceil(text.length * 0.002));

    await trackApiUsage({
      user_id: userId,
      provider,
      endpoint: `/api/generate/audio`,
      cost_cents: costCents,
    });

    // Return the stream directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('[Audio API] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// GET endpoint to list available voices
export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider') || 'openai';

  if (provider === 'openai') {
    return NextResponse.json({
      success: true,
      voices: [
        { id: 'alloy', name: 'Alloy', gender: 'neutral' },
        { id: 'echo', name: 'Echo', gender: 'male' },
        { id: 'fable', name: 'Fable', gender: 'male' },
        { id: 'onyx', name: 'Onyx', gender: 'male' },
        { id: 'nova', name: 'Nova', gender: 'female' },
        { id: 'shimmer', name: 'Shimmer', gender: 'female' },
      ],
    });
  }

  if (provider === 'elevenlabs') {
    return NextResponse.json({
      success: true,
      voices: [
        { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female' },
        { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'female' },
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female' },
        { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'male' },
        { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', gender: 'female' },
        { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', gender: 'male' },
      ],
    });
  }

  return NextResponse.json({ success: false, error: 'Unknown provider' }, { status: 400 });
}
