import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { createUniversalModel } from '@/lib/models/universal-model-factory';
import { generateText } from 'ai';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Auth and rate limiting check (using generation limits as this is an AI action)
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/remix/analyze',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { imageUrl, sourceModality, targetModality } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Source image URL is required' }, { status: 400 });
    }

    // Use Gemini 3 Pro for flagship vision analysis
    const model = createUniversalModel('google', 'gemini-3-pro');

    const systemPrompt = `You are a Cross-Modal Orchestration Engine. 
    Your goal is to analyze a source asset (in this case, an image) and generate a highly detailed, technical prompt for a target generation model (Audio).
    
    INSTRUCTIONS:
    1. Describe the visual mood, atmosphere, and energy of the image.
    2. Translate those visual characteristics into acoustic properties.
    3. Generate a prompt suitable for a high-fidelity music generation model (e.g., HeartMuLa or Stable Audio).
    
    OUTPUT FORMAT:
    Return a JSON object with:
    {
      "analysis": "Brief visual description",
      "prompt": "The generated audio prompt",
      "explanation": "Why this audio prompt matches the visual"
    }`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this image and generate a matching audio prompt.' },
            { type: 'image', image: imageUrl },
          ],
        },
      ],
    });

    try {
      const data = JSON.parse(text);
      return NextResponse.json({ success: true, ...data });
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return NextResponse.json({
        success: true,
        analysis: 'Visual content analysis complete',
        prompt: text,
        explanation: 'Extracted from model response',
      });
    }
  } catch (error: any) {
    console.error('Remix Analysis Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
