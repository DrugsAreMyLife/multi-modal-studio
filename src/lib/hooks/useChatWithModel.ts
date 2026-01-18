'use client';

import { useChat as aiUseChat } from '@ai-sdk/react';
import { SUPPORTED_MODELS, getModelById } from '@/lib/models/supported-models';
import { useMemo } from 'react';

interface UseChatWithModelOptions {
  modelId?: string;
  providerId?: string;
}

/**
 * Custom hook that wraps useChat with model selection.
 * Automatically includes modelId and providerId in all API requests.
 */
export function useChatWithModel(options: UseChatWithModelOptions = {}) {
  const { modelId = 'gpt-4.5-turbo', providerId = 'openai' } = options;

  const modelConfig = getModelById(modelId);

  if (!modelConfig) {
    console.warn(`Model not found: ${providerId}/${modelId}. Using default.`);
  }

  // Use the base useChat hook
  const chatHook = aiUseChat();

  // Override sendMessage to inject model parameters
  const originalSendMessage = chatHook.sendMessage;

  const enhancedSendMessage = useMemo(
    () => async (input: any) => {
      // Inject model parameters into the request
      const payload =
        typeof input === 'string'
          ? { text: input, modelId, providerId }
          : { ...input, modelId, providerId };

      return originalSendMessage(payload);
    },
    [originalSendMessage, modelId, providerId],
  );

  return {
    ...chatHook,
    sendMessage: enhancedSendMessage,
    modelId,
    providerId,
    modelConfig,
  };
}
