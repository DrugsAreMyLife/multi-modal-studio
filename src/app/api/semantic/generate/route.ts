import { NextRequest, NextResponse } from 'next/server';
import { getSemanticLLMProvider } from '@/lib/llm/semantic-llm-provider';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, systemPrompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const provider = getSemanticLLMProvider();
    const content = await provider.generateContent(prompt, systemPrompt);

    return NextResponse.json({ content });
  } catch (error) {
    console.error('[API Semantic Generate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
