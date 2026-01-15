import { streamText } from 'ai';
import { createUniversalModel } from '@/lib/models/universal-model-factory';
import { SUPPORTED_MODELS } from '@/lib/models/supported-models';
import { RateLimitError } from '@/lib/utils/fetch-with-retry';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages, modelId = 'gpt-4.5-turbo', providerId = 'openai' } = await req.json();

        const modelConfig = SUPPORTED_MODELS.find(
            m => m.modelId === modelId && m.providerId === providerId
        );

        if (!modelConfig) {
            return new Response(
                JSON.stringify({
                    error: 'Model not found',
                    message: `Model "${modelId}" from provider "${providerId}" is not supported`,
                    supportedModels: SUPPORTED_MODELS.map(m => ({
                        providerId: m.providerId,
                        modelId: m.modelId,
                        name: m.name
                    }))
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const result = await streamText({
            model: createUniversalModel(providerId, modelId),
            messages,
        });

        // @ts-expect-error toDataStreamResponse is present in runtime
        return result.toDataStreamResponse();
    } catch (error) {
        if (error instanceof RateLimitError) {
            return new Response(
                JSON.stringify({
                    error: 'Rate limited',
                    message: error.message,
                    retryAfter: error.retryAfter
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(error.retryAfter)
                    }
                }
            );
        }
        throw error;
    }
}
