import { NextRequest, NextResponse } from 'next/server';
import { pullModelStream } from '@/lib/ollama';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';

// Prevent Next.js from buffering the response
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for pull

export async function POST(req: NextRequest) {
  // Auth and rate limiting check (expensive operation)
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/models/local/pull',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { model } = await req.json();

    if (!model) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
    }

    // Get the stream from Ollama
    const ollamaResponse = await pullModelStream(model);

    // Create a new stream that pipes the Ollama stream directly to the client
    const stream = new ReadableStream({
      async start(controller) {
        if (!ollamaResponse.body) return;
        const reader = ollamaResponse.body.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // Pass the chunk through to the client
            controller.enqueue(value);
          }
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson', // Newline Delimited JSON
        'Transfer-Encoding': 'chunked',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Pull API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
