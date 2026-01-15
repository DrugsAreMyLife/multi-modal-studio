
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider';
import { LanguageModel } from 'ai';

interface ProviderConfig {
    apiKey?: string;
    baseURL?: string;
}

// 1. Factory Function
export function createUniversalModel(providerId: string, modelId: string): LanguageModel {
    console.log(`[UniversalFactory] Creating model: ${providerId} / ${modelId}`);

    switch (providerId) {
        case 'openai':
            const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
            return openai(modelId);

        case 'anthropic':
            const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
            return anthropic(modelId);

        case 'google':
            const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
            return google(modelId);

        case 'xai': // Uses OpenAI compatible endpoint
            const xai = createOpenAI({
                name: 'xai',
                baseURL: 'https://api.x.ai/v1',
                apiKey: process.env.XAI_API_KEY
            });
            return xai(modelId);

        case 'groq': // Uses OpenAI compatible endpoint
            const groq = createOpenAI({
                name: 'groq',
                baseURL: 'https://api.groq.com/openai/v1',
                apiKey: process.env.GROQ_API_KEY
            });
            return groq(modelId);

        case 'deepseek': // Uses OpenAI compatible endpoint
            const deepseek = createOpenAI({
                name: 'deepseek',
                baseURL: 'https://api.deepseek.com/v1',
                apiKey: process.env.DEEPSEEK_API_KEY
            });
            return deepseek(modelId);

        case 'openrouter': // Uses OpenAI compatible endpoint
            const openrouter = createOpenAI({
                name: 'openrouter',
                baseURL: 'https://openrouter.ai/api/v1',
                apiKey: process.env.OPENROUTER_API_KEY
            });
            return openrouter(modelId);

        case 'meta':
        case 'mistral':
        case 'together':
        case 'huggingface':
            // These usually work via OpenRouter or dedicated endpoints that are OpenAI compatible
            // For now, we route them through OpenRouter as a universal proxy if a direct key isn't provided
            // OR we can use OpenAI client with custom baseURL if keys are available.
            // Let's assume OpenRouter for these as the user likely wants the "universal" access.
            const universalProxy = createOpenAI({
                name: providerId,
                baseURL: 'https://openrouter.ai/api/v1',
                apiKey: process.env.OPENROUTER_API_KEY
            });
            return universalProxy(modelId);

        case 'ollama':
            const ollama = createOllama({ baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api' });
            // @ts-expect-error Provider version mismatch
            return ollama(modelId) as LanguageModel;

        default:
            // Fallback to OpenAI if unknown
            console.warn(`Unknown provider ${providerId}, falling back to OpenAI GPT-4o`);
            return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })('gpt-4o');
    }
}
