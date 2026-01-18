import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  // Auth and rate limiting check
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/transcribe',
    RATE_LIMITS.transcription,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const formData = await req.formData();
    const audio = formData.get('audio') as File;

    if (!audio) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Check if OpenAI key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Fallback: return mock transcription for development
      return NextResponse.json({
        text: '[Transcription unavailable - configure OPENAI_API_KEY]',
        mock: true,
      });
    }

    // Convert File to Buffer for OpenAI
    const buffer = Buffer.from(await audio.arrayBuffer());
    const file = new File([buffer], audio.name, { type: audio.type });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'json',
    });

    return NextResponse.json({
      text: transcription.text,
      mock: false,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
