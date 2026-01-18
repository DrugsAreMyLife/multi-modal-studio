import { streamText } from 'ai';
import { createUniversalModel } from '@/lib/models/universal-model-factory';
import { SUPPORTED_MODELS } from '@/lib/models/supported-models';
import { RateLimitError } from '@/lib/utils/fetch-with-retry';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { trackApiUsage } from '@/lib/db/server';
import { NextRequest } from 'next/server';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Auth and rate limiting check
  const authResult = await requireAuthAndRateLimit(req, '/api/chat', RATE_LIMITS.chat);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userId = authResult.userId;

  try {
    const { messages, modelId = 'gpt-4.5-turbo', providerId = 'openai' } = await req.json();

    const modelConfig = SUPPORTED_MODELS.find(
      (m) => m.modelId === modelId && m.providerId === providerId,
    );

    if (!modelConfig) {
      return new Response(
        JSON.stringify({
          error: 'Model not found',
          message: `Model "${modelId}" from provider "${providerId}" is not supported`,
          supportedModels: SUPPORTED_MODELS.map((m) => ({
            providerId: m.providerId,
            modelId: m.modelId,
            name: m.name,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const result = await streamText({
      model: createUniversalModel(providerId, modelId),
      messages,
      onFinish: async ({ usage }) => {
        // Track API usage in the background
        if (usage) {
          const u = usage as any;
          // Approximate cost calculation based on usage and model config
          // For now, using a simplified flat rate or placeholders
          const costCents = Math.ceil(u.promptTokens * 0.0001 + u.completionTokens * 0.0003);

          await trackApiUsage({
            user_id: userId,
            provider: providerId,
            endpoint: '/api/chat',
            tokens_in: u.promptTokens,
            tokens_out: u.completionTokens,
            cost_cents: costCents > 0 ? costCents : 1, // Minimum 1 cent for tracking
          }).catch((err) => console.error('Failed to track chat usage:', err));
        }
      },
    });

    // @ts-expect-error toDataStreamResponse is present in runtime
    return result.toDataStreamResponse();
  } catch (error) {
    if (error instanceof RateLimitError) {
      return new Response(
        JSON.stringify({
          error: 'Rate limited',
          message: error.message,
          retryAfter: error.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(error.retryAfter),
          },
        },
      );
    }
    throw error;
  }
}
