import { generateText } from 'ai';
import { createUniversalModel } from '@/lib/models/universal-model-factory';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  // Auth and rate limiting check (using chat limits as titling is cheap but frequent)
  const authResult = await requireAuthAndRateLimit(req, '/api/title', RATE_LIMITS.chat);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    // Use a fast, cheap model for titling via the universal factory
    const { text } = await generateText({
      model: createUniversalModel('openai', 'gpt-4o-mini'),
      system:
        'You are a helpful assistant that generates concise (3-5 words) titles for conversations. You do not use quotes or punctuation like periods.',
      prompt: `Generate a title for the following conversation:\n\n${messages
        .map((m: any) => `${m.role}: ${m.content}`)
        .join('\n')
        .slice(0, 2000)}`,
    });

    return Response.json({ title: text });
  } catch (error) {
    console.error('Title generation error:', error);
    return new Response('Error generating title', { status: 500 });
  }
}
