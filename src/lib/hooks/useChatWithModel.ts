'use client';

import { useChat as aiUseChat } from '@ai-sdk/react';
import { SUPPORTED_MODELS } from '@/lib/models/supported-models';

interface UseChatWithModelOptions {
    id?: string;
    modelId?: string;
    providerId?: string;
    onFinish?: (message: any) => void;
    [key: string]: any;
}

export function useChatWithModel(options: UseChatWithModelOptions = {}) {
    const {
        modelId = 'gpt-4.5-turbo',
        providerId = 'openai',
        ...aiOptions
    } = options;

    const modelConfig = SUPPORTED_MODELS.find(
        m => m.modelId === modelId && m.providerId === providerId
    );

    if (!modelConfig) {
        console.warn(`Model not found: ${providerId}/${modelId}. Using default.`);
    }

    return aiUseChat({
        ...aiOptions,
        api: '/api/chat',
        body: {
            modelId,
            providerId,
        },
    });
}
