import { streamText } from 'ai';
import { createUniversalModel } from '@/lib/models/universal-model-factory';
import { SUPPORTED_MODELS } from '@/lib/models/supported-models';
import { RateLimitError } from '@/lib/utils/fetch-with-retry';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { trackApiUsage } from '@/lib/db/server';
import { validatePrompt, ValidationRules, safeJsonParse } from '@/lib/validation/input-validation';
import { NextRequest, NextResponse } from 'next/server';
import { streamWithTimeout } from '@/lib/utils/stream-utils';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // Auth and rate limiting check
    const authResult = await requireAuthAndRateLimit(req, '/api/chat', RATE_LIMITS.chat);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const userId = authResult.userId;

    const {
      data: body,
      error: parseError,
      statusCode,
    } = await safeJsonParse<{
      messages: any[];
      modelId?: string;
      providerId?: string;
    }>(req);

    if (parseError || !body) {
      return NextResponse.json(
        { success: false, error: parseError || 'Invalid request body' },
        { status: statusCode || 400 },
      );
    }

    const { messages, modelId = 'gpt-4.5-turbo', providerId = 'openai' } = body;

    // Input Validation
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'Invalid messages format' },
        { status: 400 },
      );
    }
    if (messages.length > ValidationRules.conversation.maxMessages) {
      return NextResponse.json(
        {
          success: false,
          error: `Conversation too long (max ${ValidationRules.conversation.maxMessages} messages)`,
        },
        { status: 400 },
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.content) {
      const validation = validatePrompt(lastMessage.content);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }
    }

    const modelConfig = SUPPORTED_MODELS.find(
      (m) => m.modelId === modelId && m.providerId === providerId,
    );

    if (!modelConfig) {
      return NextResponse.json(
        {
          success: false,
          error: 'Model not found',
          message: `Model "${modelId}" from provider "${providerId}" is not supported`,
        },
        { status: 400 },
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
    const response = result.toDataStreamResponse();

    // Apply streaming timeout
    if (response.body) {
      const stream = streamWithTimeout(response.body, 30000); // 30s timeout for chat
      return new Response(stream, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      });
    }

    return response;
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limited',
          message: error.message,
          retryAfter: error.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(error.retryAfter),
          },
        },
      );
    }
    console.error('[Chat API] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
