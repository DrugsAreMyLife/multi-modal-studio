import { Bot, Zap, Brain, Sparkles, Cpu, Aperture, Server, Cloud } from 'lucide-react';

export interface ModelPricing {
    inputPerMillion: number;  // USD per 1M tokens
    outputPerMillion: number; // USD per 1M tokens
    cachedInputPerMillion?: number;
}

export interface ModelSpecs {
    contextWindow: number;   // Max tokens
    maxOutput?: number;      // Max output tokens
    trainingCutoff?: string; // e.g., "Oct 2023"
    modalities?: string[];   // ['text', 'image', 'audio', 'video']
    supportsFunctionCalling?: boolean;
    supportsVision?: boolean;
    supportsStreaming?: boolean;
    supportsJson?: boolean;
}

export interface ModelRateLimits {
    rpm?: number;         // Requests per minute
    tpm?: number;         // Tokens per minute
    rpd?: number;         // Requests per day
    tier?: string;        // e.g., "Tier 1", "Free"
}

export interface AIModel {
    id: string;
    name: string;
    providerId: string;
    description?: string;
    isLocal?: boolean;
    releaseDate?: string;
    pricing?: ModelPricing;
    specs?: ModelSpecs;
    rateLimits?: ModelRateLimits;
    bestFor?: string[];
    notes?: string;
}

export interface AIProvider {
    id: string;
    name: string;
    icon: any;
    color: string;
    models: AIModel[];
    isLocal?: boolean;
    apiDocs?: string;
}

export const MODEL_PROVIDERS: AIProvider[] = [
    // ===== LOCAL PROVIDERS =====
    {
        id: 'ollama',
        name: 'Ollama (Local)',
        icon: Server,
        color: '#ffffff',
        isLocal: true,
        apiDocs: 'https://ollama.ai/docs',
        models: [
            { id: 'llama3.3:70b', name: 'Llama 3.3 70B', providerId: 'ollama', isLocal: true, description: 'Latest Llama 3.3', specs: { contextWindow: 128000, modalities: ['text'] } },
            { id: 'llama3.2:3b', name: 'Llama 3.2 3B', providerId: 'ollama', isLocal: true },
            { id: 'qwen2.5:72b', name: 'Qwen 2.5 72B', providerId: 'ollama', isLocal: true },
            { id: 'qwen2.5-coder:32b', name: 'Qwen 2.5 Coder 32B', providerId: 'ollama', isLocal: true, bestFor: ['coding'] },
            { id: 'deepseek-r1:70b', name: 'DeepSeek-R1 70B', providerId: 'ollama', isLocal: true, bestFor: ['reasoning'] },
            { id: 'deepseek-r1:32b', name: 'DeepSeek-R1 32B', providerId: 'ollama', isLocal: true },
            { id: 'gemma2:27b', name: 'Gemma 2 27B', providerId: 'ollama', isLocal: true },
            { id: 'mixtral:8x22b', name: 'Mixtral 8x22B', providerId: 'ollama', isLocal: true },
            { id: 'phi3:14b', name: 'Phi-3 14B', providerId: 'ollama', isLocal: true },
            { id: 'codellama:70b', name: 'CodeLlama 70B', providerId: 'ollama', isLocal: true, bestFor: ['coding'] },
        ]
    },
    {
        id: 'lmstudio',
        name: 'LM Studio (Local)',
        icon: Server,
        color: '#00d4aa',
        isLocal: true,
        apiDocs: 'https://lmstudio.ai/docs',
        models: [
            { id: 'local-model', name: 'Currently Loaded Model', providerId: 'lmstudio', isLocal: true, description: 'Uses whatever model is loaded in LM Studio' },
        ]
    },
    {
        id: 'vllm',
        name: 'vLLM (Self-Hosted)',
        icon: Cpu,
        color: '#7c3aed',
        isLocal: true,
        apiDocs: 'https://docs.vllm.ai',
        models: [
            { id: 'deployed-model', name: 'Deployed Model', providerId: 'vllm', isLocal: true, description: 'Your vLLM endpoint' },
        ]
    },

    // ===== CLOUD PROVIDERS =====
    {
        id: 'openai',
        name: 'OpenAI',
        icon: Zap,
        color: '#10a37f',
        apiDocs: 'https://platform.openai.com/docs',
        models: [
            // GPT-5 Series (Released Aug 2025)
            {
                id: 'gpt-5',
                name: 'GPT-5',
                providerId: 'openai',
                description: 'Most capable model with advanced reasoning and agentic capabilities',
                releaseDate: 'Aug 2025',
                pricing: { inputPerMillion: 10.00, outputPerMillion: 30.00 },
                specs: { contextWindow: 256000, maxOutput: 32768, modalities: ['text', 'image', 'audio'], supportsFunctionCalling: true, supportsVision: true, supportsStreaming: true },
                bestFor: ['complex reasoning', 'agents', 'multimodal'],
            },
            {
                id: 'gpt-5.2',
                name: 'GPT-5.2',
                providerId: 'openai',
                description: 'Frontier model for professional work and long-running agents',
                releaseDate: 'Dec 2025',
                pricing: { inputPerMillion: 12.00, outputPerMillion: 36.00 },
                specs: { contextWindow: 256000, modalities: ['text', 'image'], supportsFunctionCalling: true },
                bestFor: ['agentic coding', 'long-horizon tasks'],
            },
            {
                id: 'gpt-5-mini',
                name: 'GPT-5 Mini',
                providerId: 'openai',
                description: 'Fast and affordable GPT-5 variant',
                releaseDate: 'Aug 2025',
                pricing: { inputPerMillion: 1.00, outputPerMillion: 3.00 },
                specs: { contextWindow: 128000, supportsFunctionCalling: true },
            },
            {
                id: 'gpt-4.5-turbo',
                name: 'GPT-4.5 Turbo',
                providerId: 'openai',
                description: '3x faster than GPT-4o, 70% cheaper, 256K context',
                releaseDate: 'Jan 2026',
                pricing: { inputPerMillion: 1.50, outputPerMillion: 6.00 },
                specs: { contextWindow: 256000, supportsFunctionCalling: true, supportsVision: true },
                bestFor: ['speed', 'cost-efficiency'],
            },
            // o-Series Reasoning
            {
                id: 'o3',
                name: 'o3',
                providerId: 'openai',
                description: 'Advanced reasoning with autonomous tool use',
                releaseDate: 'Apr 2025',
                pricing: { inputPerMillion: 15.00, outputPerMillion: 60.00 },
                specs: { contextWindow: 200000, supportsFunctionCalling: true },
                rateLimits: { rpm: 500, tpm: 150000 },
                bestFor: ['math', 'science', 'complex reasoning'],
            },
            {
                id: 'o3-mini',
                name: 'o3 Mini',
                providerId: 'openai',
                description: 'Cost-efficient reasoning model',
                releaseDate: 'Jan 2025',
                pricing: { inputPerMillion: 1.10, outputPerMillion: 4.40, cachedInputPerMillion: 0.275 },
                specs: { contextWindow: 128000 },
                bestFor: ['fast reasoning', 'budget-friendly'],
            },
            {
                id: 'o4-mini',
                name: 'o4 Mini',
                providerId: 'openai',
                description: 'Speed-optimized reasoning',
                releaseDate: 'Apr 2025',
                pricing: { inputPerMillion: 1.50, outputPerMillion: 6.00 },
                specs: { contextWindow: 128000 },
            },
            // GPT-4o Legacy
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                providerId: 'openai',
                description: 'Previous flagship multimodal model',
                pricing: { inputPerMillion: 2.50, outputPerMillion: 10.00, cachedInputPerMillion: 1.25 },
                specs: { contextWindow: 128000, maxOutput: 16384, modalities: ['text', 'image', 'audio'], supportsFunctionCalling: true, supportsVision: true },
            },
            {
                id: 'gpt-4o-mini',
                name: 'GPT-4o Mini',
                providerId: 'openai',
                description: 'Fast and affordable',
                pricing: { inputPerMillion: 0.15, outputPerMillion: 0.60, cachedInputPerMillion: 0.075 },
                specs: { contextWindow: 128000, supportsFunctionCalling: true },
            },
        ]
    },
    {
        id: 'anthropic',
        name: 'Anthropic',
        icon: Brain,
        color: '#d97757',
        apiDocs: 'https://docs.anthropic.com',
        models: [
            // Claude 4 Series (Released 2025)
            {
                id: 'claude-opus-4.5',
                name: 'Claude Opus 4.5',
                providerId: 'anthropic',
                description: 'Most powerful Claude - coding, agentic tasks, computer use',
                releaseDate: 'Nov 2025',
                pricing: { inputPerMillion: 15.00, outputPerMillion: 75.00 },
                specs: { contextWindow: 200000, maxOutput: 32768, modalities: ['text', 'image'], supportsFunctionCalling: true, supportsVision: true },
                bestFor: ['coding', 'agents', 'computer use', 'research'],
                notes: 'Supports "Infinite Chats" feature',
            },
            {
                id: 'claude-sonnet-4.5',
                name: 'Claude Sonnet 4.5',
                providerId: 'anthropic',
                description: 'Best balance of capability and speed',
                releaseDate: 'Sep 2025',
                pricing: { inputPerMillion: 3.00, outputPerMillion: 15.00 },
                specs: { contextWindow: 200000, supportsFunctionCalling: true, supportsVision: true },
                bestFor: ['coding', 'analysis', 'general use'],
            },
            {
                id: 'claude-opus-4',
                name: 'Claude Opus 4',
                providerId: 'anthropic',
                description: 'Previous flagship with hybrid reasoning',
                releaseDate: 'May 2025',
                pricing: { inputPerMillion: 15.00, outputPerMillion: 75.00 },
                specs: { contextWindow: 200000, supportsFunctionCalling: true },
            },
            {
                id: 'claude-sonnet-4',
                name: 'Claude Sonnet 4',
                providerId: 'anthropic',
                description: 'Extended thinking capabilities',
                releaseDate: 'May 2025',
                pricing: { inputPerMillion: 3.00, outputPerMillion: 15.00 },
                specs: { contextWindow: 200000 },
            },
            // Claude 3.5
            {
                id: 'claude-3-5-sonnet-20241022',
                name: 'Claude 3.5 Sonnet',
                providerId: 'anthropic',
                pricing: { inputPerMillion: 3.00, outputPerMillion: 15.00 },
                specs: { contextWindow: 200000, supportsFunctionCalling: true, supportsVision: true },
                rateLimits: { rpm: 50, tpm: 400000, tier: 'Tier 1' },
            },
            {
                id: 'claude-3-5-haiku-20241022',
                name: 'Claude 3.5 Haiku',
                providerId: 'anthropic',
                description: 'Fast and affordable',
                pricing: { inputPerMillion: 0.80, outputPerMillion: 4.00 },
                specs: { contextWindow: 200000 },
            },
        ]
    },
    {
        id: 'google',
        name: 'Google',
        icon: Sparkles,
        color: '#4285f4',
        apiDocs: 'https://ai.google.dev/docs',
        models: [
            // Gemini 2.5 Series
            {
                id: 'gemini-2.5-pro',
                name: 'Gemini 2.5 Pro',
                providerId: 'google',
                description: 'Most sophisticated reasoning model with thinking tokens',
                releaseDate: 'Jun 2025',
                pricing: { inputPerMillion: 1.25, outputPerMillion: 5.00 },
                specs: { contextWindow: 1000000, modalities: ['text', 'image', 'audio', 'video'], supportsFunctionCalling: true, supportsVision: true },
                bestFor: ['complex reasoning', 'long context', 'multimodal'],
                notes: 'Expanding to 2M context window',
            },
            {
                id: 'gemini-2.5-flash',
                name: 'Gemini 2.5 Flash',
                providerId: 'google',
                description: 'Speed optimized with dynamic reasoning',
                releaseDate: 'Jun 2025',
                pricing: { inputPerMillion: 0.10, outputPerMillion: 0.40 },
                specs: { contextWindow: 1000000, supportsFunctionCalling: true },
                rateLimits: { tpm: 37900000 },
                bestFor: ['speed', 'high-volume', 'cost-efficiency'],
            },
            {
                id: 'gemini-2.5-flash-lite',
                name: 'Gemini 2.5 Flash Lite',
                providerId: 'google',
                description: 'Lowest cost, highest speed',
                releaseDate: 'Jun 2025',
                pricing: { inputPerMillion: 0.10, outputPerMillion: 0.40 },
                specs: { contextWindow: 1000000 },
            },
            // Gemini 2.0
            {
                id: 'gemini-2.0-flash-thinking',
                name: 'Gemini 2.0 Flash Thinking',
                providerId: 'google',
                description: 'Reasoning model',
                pricing: { inputPerMillion: 0.10, outputPerMillion: 0.40 },
                specs: { contextWindow: 128000 },
            },
        ]
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        icon: Cpu,
        color: '#0066ff',
        apiDocs: 'https://platform.deepseek.com/docs',
        models: [
            {
                id: 'deepseek-chat',
                name: 'DeepSeek V3.2',
                providerId: 'deepseek',
                description: 'Latest chat model - extremely cost effective',
                pricing: { inputPerMillion: 0.28, outputPerMillion: 0.42, cachedInputPerMillion: 0.028 },
                specs: { contextWindow: 128000, supportsFunctionCalling: true },
                bestFor: ['cost-efficiency', 'general chat'],
                notes: 'Dynamic rate limits based on traffic',
            },
            {
                id: 'deepseek-reasoner',
                name: 'DeepSeek R1',
                providerId: 'deepseek',
                description: 'Reasoning model - competes with o1',
                pricing: { inputPerMillion: 0.55, outputPerMillion: 2.19, cachedInputPerMillion: 0.14 },
                specs: { contextWindow: 128000 },
                bestFor: ['reasoning', 'math', 'coding'],
            },
        ]
    },
    {
        id: 'xai',
        name: 'xAI',
        icon: Bot,
        color: '#1da1f2',
        models: [
            {
                id: 'grok-2',
                name: 'Grok 2',
                providerId: 'xai',
                description: 'Flagship model with real-time knowledge',
                specs: { contextWindow: 128000, supportsVision: true },
            },
            {
                id: 'grok-2-vision',
                name: 'Grok 2 Vision',
                providerId: 'xai',
                description: 'Multimodal Grok',
                specs: { contextWindow: 128000, supportsVision: true },
            },
        ]
    },
    {
        id: 'meta',
        name: 'Meta (Llama)',
        icon: Cpu,
        color: '#0668E1',
        models: [
            {
                id: 'llama-4-scout',
                name: 'Llama 4 Scout',
                providerId: 'meta',
                description: 'Mixture-of-experts, multimodal, 12 languages',
                releaseDate: 'Apr 2025',
                specs: { contextWindow: 128000, modalities: ['text', 'image'] },
                notes: 'Open source',
            },
            {
                id: 'llama-4-maverick',
                name: 'Llama 4 Maverick',
                providerId: 'meta',
                description: 'Advanced variant of Llama 4',
                releaseDate: 'Apr 2025',
                specs: { contextWindow: 128000, modalities: ['text', 'image'] },
            },
            {
                id: 'llama-3.3-70b',
                name: 'Llama 3.3 70B',
                providerId: 'meta',
                specs: { contextWindow: 128000 },
            },
        ]
    },
    {
        id: 'mistral',
        name: 'Mistral AI',
        icon: Aperture,
        color: '#ff7000',
        apiDocs: 'https://docs.mistral.ai',
        models: [
            {
                id: 'mistral-large-latest',
                name: 'Mistral Large',
                providerId: 'mistral',
                description: 'Flagship model',
                pricing: { inputPerMillion: 2.00, outputPerMillion: 6.00 },
                specs: { contextWindow: 128000, supportsFunctionCalling: true },
            },
            {
                id: 'pixtral-large-latest',
                name: 'Pixtral Large',
                providerId: 'mistral',
                description: 'Multimodal flagship',
                specs: { contextWindow: 128000, supportsVision: true },
            },
            {
                id: 'codestral-latest',
                name: 'Codestral',
                providerId: 'mistral',
                description: 'Specialized for code generation',
                bestFor: ['coding'],
            },
            {
                id: 'mistral-small-latest',
                name: 'Mistral Small',
                providerId: 'mistral',
                pricing: { inputPerMillion: 0.20, outputPerMillion: 0.60 },
            },
        ]
    },
    {
        id: 'groq',
        name: 'Groq',
        icon: Zap,
        color: '#f55036',
        apiDocs: 'https://console.groq.com/docs',
        models: [
            {
                id: 'llama-3.3-70b-versatile',
                name: 'Llama 3.3 70B Versatile',
                providerId: 'groq',
                description: 'Ultra-fast inference',
                specs: { contextWindow: 128000 },
                bestFor: ['speed', 'low-latency'],
            },
            {
                id: 'deepseek-r1-distill-llama-70b',
                name: 'DeepSeek R1 Distill 70B',
                providerId: 'groq',
                bestFor: ['reasoning', 'speed'],
            },
            {
                id: 'mixtral-8x7b-32768',
                name: 'Mixtral 8x7B',
                providerId: 'groq',
            },
        ]
    },
    {
        id: 'openrouter',
        name: 'OpenRouter',
        icon: Cloud,
        color: '#6366f1',
        apiDocs: 'https://openrouter.ai/docs',
        models: [
            { id: 'openai/gpt-5', name: 'GPT-5 (via OpenRouter)', providerId: 'openrouter' },
            { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5 (via OpenRouter)', providerId: 'openrouter' },
            { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (via OpenRouter)', providerId: 'openrouter' },
            { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (via OpenRouter)', providerId: 'openrouter' },
            { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout (via OpenRouter)', providerId: 'openrouter' },
        ]
    },
    {
        id: 'together',
        name: 'Together AI',
        icon: Cloud,
        color: '#6366f1',
        apiDocs: 'https://docs.together.ai',
        models: [
            { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', providerId: 'together' },
            { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', providerId: 'together' },
            { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B Turbo', providerId: 'together' },
        ]
    },
    {
        id: 'huggingface',
        name: 'Hugging Face',
        icon: Bot,
        color: '#ffd21e',
        apiDocs: 'https://huggingface.co/docs/api-inference',
        models: [
            { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B Instruct', providerId: 'huggingface' },
            { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B Instruct', providerId: 'huggingface' },
            { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', providerId: 'huggingface' },
        ]
    },
];
