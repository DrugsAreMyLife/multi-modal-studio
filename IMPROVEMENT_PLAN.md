# Multi-Modal Generation Studio - 29 Improvements Plan

## Executive Summary

| Metric                | Value                                                     |
| --------------------- | --------------------------------------------------------- |
| **Total Tasks**       | 29 major improvements (25 original + 4 from Gemini audit) |
| **Total Subtasks**    | 127 implementable subtasks                                |
| **Total Micro-Tasks** | 46 atomic tasks (Phase 0-1)                               |
| **Estimated Hours**   | 172 hours (~4.5 weeks team effort)                        |
| **Phases**            | 7 sequential phases                                       |
| **Parallelization**   | 60% of tasks can run concurrently                         |
| **Risk Level**        | Medium-High (API integrations, state refactors)           |
| **Critical Path**     | Phase 0 → Phase 1 → Phase 4 (database)                    |

---

# PHASE 0: Critical Gaps (BLOCKING)

**Duration**: 16 hours | **Priority**: CRITICAL | **Blocks**: Phase 1-6 | **Micro-Tasks**: 28

---

## Task 0.1: Add Model Metadata to supported-models.ts

**File**: `src/lib/models/supported-models.ts`
**Issue**: `ModelConfig` interface only has `providerId`, `modelId`, `name`
**Impact**: UI cannot warn about token limits or estimate costs

### Micro-Tasks (9 tasks, ~50 min sequential, ~15 min parallel)

#### 0.1.1: Create ModelCapabilities Interface

- **File**: `src/lib/models/supported-models.ts`
- **Lines**: After line 15 (after ModelProviderId type)
- **Duration**: 5 min
- **Dependencies**: None
- **Code**:

```typescript
export interface ModelCapabilities {
  vision: boolean;
  functionCalling: boolean;
  jsonMode: boolean;
  streaming: boolean;
}
```

#### 0.1.2: Create ModelPricing Interface

- **File**: `src/lib/models/supported-models.ts`
- **Lines**: After ModelCapabilities (line ~22)
- **Duration**: 5 min
- **Dependencies**: None
- **Code**:

```typescript
export interface ModelPricing {
  inputPer1kTokens: number;
  outputPer1kTokens: number;
  currency: 'USD';
}
```

#### 0.1.3: Extend ModelConfig Interface

- **File**: `src/lib/models/supported-models.ts`
- **Lines**: Replace lines 17-21
- **Duration**: 6 min
- **Dependencies**: 0.1.1, 0.1.2
- **Replace**:

```typescript
export interface ModelConfig {
  providerId: ModelProviderId;
  modelId: string;
  name: string;
}
```

- **With**:

```typescript
export interface ModelConfig {
  providerId: ModelProviderId;
  modelId: string;
  name: string;
  contextWindow: number;
  maxOutputTokens: number;
  pricing: ModelPricing;
  capabilities: ModelCapabilities;
}
```

#### 0.1.4: Update OpenAI Models (GPT-5, o3, GPT-4.5)

- **File**: `src/lib/models/supported-models.ts`
- **Lines**: 26-28
- **Duration**: 8 min
- **Dependencies**: 0.1.3
- **Replace each entry with full metadata** (example for GPT-5):

```typescript
{
    providerId: 'openai',
    modelId: 'gpt-5',
    name: 'GPT-5',
    contextWindow: 256000,
    maxOutputTokens: 32768,
    pricing: { inputPer1kTokens: 0.03, outputPer1kTokens: 0.06, currency: 'USD' },
    capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true }
},
```

#### 0.1.5: Update Anthropic Models (Claude 4.5 Opus/Sonnet)

- **File**: `src/lib/models/supported-models.ts`
- **Lines**: 31-32
- **Duration**: 6 min
- **Dependencies**: 0.1.3
- **Add full metadata for both Claude models**

#### 0.1.6: Update Google Models (Gemini 2.5 Pro/Flash)

- **File**: `src/lib/models/supported-models.ts`
- **Lines**: 35-36
- **Duration**: 6 min
- **Dependencies**: 0.1.3

#### 0.1.7: Update DeepSeek & Meta/Mistral Models

- **File**: `src/lib/models/supported-models.ts`
- **Lines**: 39-44
- **Duration**: 8 min
- **Dependencies**: 0.1.3

#### 0.1.8: Update Groq & Ollama Models

- **File**: `src/lib/models/supported-models.ts`
- **Lines**: 47-52
- **Duration**: 6 min
- **Dependencies**: 0.1.3

#### 0.1.9: Add validateModelConfig Helper

- **File**: `src/lib/models/supported-models.ts`
- **Lines**: End of file (after SUPPORTED_MODELS array)
- **Duration**: 8 min
- **Dependencies**: 0.1.3
- **Code**:

```typescript
export function validateModelConfig(config: unknown): config is ModelConfig {
  if (!config || typeof config !== 'object') return false;
  const c = config as Record<string, unknown>;
  return (
    typeof c.providerId === 'string' &&
    typeof c.modelId === 'string' &&
    typeof c.name === 'string' &&
    typeof c.contextWindow === 'number' &&
    typeof c.maxOutputTokens === 'number' &&
    c.pricing !== null &&
    typeof c.pricing === 'object' &&
    c.capabilities !== null &&
    typeof c.capabilities === 'object'
  );
}

export function getModelById(modelId: string): ModelConfig | undefined {
  return SUPPORTED_MODELS.find((m) => m.modelId === modelId);
}
```

---

## Task 0.2: Add modelId to ChatThread Interface

**File**: `src/lib/store/chat-store.ts`
**Issue**: ChatThread interface (lines 6-12) has no `modelId` field
**Impact**: Threads don't remember which model created them

### Micro-Tasks (6 tasks, ~25 min sequential)

#### 0.2.1: Import ModelConfig Type

- **File**: `src/lib/store/chat-store.ts`
- **Lines**: After line 4 (imports section)
- **Duration**: 3 min
- **Dependencies**: 0.1.3
- **Code**:

```typescript
import { ModelConfig } from '@/lib/models/supported-models';
```

#### 0.2.2: Add modelId to ChatThread Interface

- **File**: `src/lib/store/chat-store.ts`
- **Lines**: Line 12 (before closing brace of ChatThread)
- **Duration**: 4 min
- **Dependencies**: 0.2.1
- **Add**:

```typescript
    modelId?: string;
    modelConfig?: ModelConfig;
```

#### 0.2.3: Update createNewThread Default State

- **File**: `src/lib/store/chat-store.ts`
- **Lines**: 55-63 (newThread object)
- **Duration**: 5 min
- **Dependencies**: 0.2.2
- **Add to newThread object**:

```typescript
    modelId: 'gpt-4.5-turbo', // Default model
```

#### 0.2.4: Add setThreadModel Action to Interface

- **File**: `src/lib/store/chat-store.ts`
- **Lines**: 36 (before closing brace of ChatState)
- **Duration**: 4 min
- **Dependencies**: 0.2.2
- **Add**:

```typescript
    setThreadModel: (threadId: string, modelId: string) => void;
```

#### 0.2.5: Implement setThreadModel Action

- **File**: `src/lib/store/chat-store.ts`
- **Lines**: After line 326 (after togglePin)
- **Duration**: 6 min
- **Dependencies**: 0.2.4
- **Code**:

```typescript
            setThreadModel: (threadId, modelId) => set(state => {
                const thread = state.threads[threadId];
                if (!thread) return state;
                return {
                    threads: {
                        ...state.threads,
                        [threadId]: {
                            ...thread,
                            modelId,
                            updatedAt: Date.now()
                        }
                    }
                };
            }),
```

#### 0.2.6: Update Persist Schema Version

- **File**: `src/lib/store/chat-store.ts`
- **Lines**: 329-331 (persist config)
- **Duration**: 5 min
- **Dependencies**: 0.2.5
- **Replace**:

```typescript
        {
            name: 'chat-storage',
        }
```

- **With**:

```typescript
        {
            name: 'chat-storage',
            version: 2,
            migrate: (persistedState: any, version: number) => {
                if (version < 2) {
                    // Add default modelId to existing threads
                    const state = persistedState as any;
                    if (state.threads) {
                        Object.keys(state.threads).forEach(id => {
                            if (!state.threads[id].modelId) {
                                state.threads[id].modelId = 'gpt-4.5-turbo';
                            }
                        });
                    }
                }
                return persistedState;
            }
        }
```

---

## Task 0.3: Add Rate Limit Handling with Retries

**Files**: NEW `src/lib/utils/fetch-with-retry.ts`, MODIFY `src/app/api/chat/route.ts`
**Issue**: Zero handling for HTTP 429 or 5xx errors

### Micro-Tasks (7 tasks, ~40 min sequential)

#### 0.3.1: Create fetch-with-retry.ts File Structure

- **File**: NEW `src/lib/utils/fetch-with-retry.ts`
- **Duration**: 6 min
- **Dependencies**: None
- **Code**:

```typescript
export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
};
```

#### 0.3.2: Create RateLimitError Class

- **File**: `src/lib/utils/fetch-with-retry.ts`
- **Lines**: After RetryConfig
- **Duration**: 5 min
- **Dependencies**: 0.3.1
- **Code**:

```typescript
export class RateLimitError extends Error {
  retryAfter: number;
  statusCode: number;

  constructor(message: string, retryAfter: number, statusCode: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.statusCode = statusCode;
  }
}
```

#### 0.3.3: Add isRetryableError Helper

- **File**: `src/lib/utils/fetch-with-retry.ts`
- **Duration**: 4 min
- **Dependencies**: 0.3.1
- **Code**:

```typescript
export function isRetryableError(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}
```

#### 0.3.4: Add Delay Utility

- **File**: `src/lib/utils/fetch-with-retry.ts`
- **Duration**: 3 min
- **Dependencies**: 0.3.1
- **Code**:

```typescript
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  return Math.min(exponentialDelay, config.maxDelayMs);
}
```

#### 0.3.5: Implement fetchWithRetry Function

- **File**: `src/lib/utils/fetch-with-retry.ts`
- **Duration**: 12 min
- **Dependencies**: 0.3.2, 0.3.3, 0.3.4
- **Code**:

```typescript
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!isRetryableError(response.status)) {
        return response;
      }

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '0', 10);
        const delayMs = retryAfter > 0 ? retryAfter * 1000 : calculateDelay(attempt, config);

        if (attempt < config.maxRetries) {
          console.warn(
            `Rate limited. Retrying in ${delayMs}ms... (attempt ${attempt + 1}/${config.maxRetries})`,
          );
          await delay(delayMs);
          continue;
        }

        throw new RateLimitError('Rate limit exceeded. Please try again later.', retryAfter, 429);
      }

      // Handle 5xx errors
      if (attempt < config.maxRetries) {
        const delayMs = calculateDelay(attempt, config);
        console.warn(`Server error ${response.status}. Retrying in ${delayMs}ms...`);
        await delay(delayMs);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < config.maxRetries) {
        const delayMs = calculateDelay(attempt, config);
        await delay(delayMs);
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
```

#### 0.3.6: Export All from Index

- **File**: `src/lib/utils/fetch-with-retry.ts`
- **Duration**: 2 min
- **Dependencies**: 0.3.5
- **Ensure all exports are at top level**

#### 0.3.7: Add Error Handler to Chat Route

- **File**: `src/app/api/chat/route.ts`
- **Lines**: Wrap entire POST handler
- **Duration**: 8 min
- **Dependencies**: 0.3.5
- **Add try-catch with user-friendly error responses**:

```typescript
import { RateLimitError } from '@/lib/utils/fetch-with-retry';

// Inside POST handler, wrap with:
try {
  // existing code...
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
```

---

## Task 0.4: Add Prototype Mode Indicators for Mock Services

**Files**: `src/lib/integrations/providers.ts`, NEW `src/components/shared/PrototypeBadge.tsx`
**Issue**: YouTubePublisher, SlackNotifier return `isConnected() = false` but UI doesn't warn

### Micro-Tasks (6 tasks, ~30 min sequential)

#### 0.4.1: Create PrototypeBadge Component

- **File**: NEW `src/components/shared/PrototypeBadge.tsx`
- **Duration**: 8 min
- **Dependencies**: None
- **Code**:

```typescript
'use client';

import { Wrench } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PrototypeBadgeProps {
    className?: string;
}

export function PrototypeBadge({ className }: PrototypeBadgeProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 ${className}`}>
                    <Wrench className="w-3 h-3" />
                    Prototype
                </span>
            </TooltipTrigger>
            <TooltipContent>
                <p>This integration is not yet connected.</p>
                <p className="text-muted-foreground text-xs">Full functionality coming soon.</p>
            </TooltipContent>
        </Tooltip>
    );
}
```

#### 0.4.2: Add isPrototype Property to Integration Interface

- **File**: `src/lib/integrations/providers.ts`
- **Lines**: Find base integration interface
- **Duration**: 4 min
- **Dependencies**: None
- **Add to interface**:

```typescript
isPrototype?: boolean;
```

#### 0.4.3: Mark YouTubePublisher as Prototype

- **File**: `src/lib/integrations/providers.ts`
- **Lines**: YouTubePublisher class
- **Duration**: 3 min
- **Dependencies**: 0.4.2
- **Add property**:

```typescript
isPrototype = true;
```

#### 0.4.4: Mark SlackNotifier as Prototype

- **File**: `src/lib/integrations/providers.ts`
- **Lines**: SlackNotifier class
- **Duration**: 3 min
- **Dependencies**: 0.4.2
- **Add property**:

```typescript
isPrototype = true;
```

#### 0.4.5: Update Integration UI to Show Badge

- **File**: Find integration settings component
- **Duration**: 8 min
- **Dependencies**: 0.4.1, 0.4.3, 0.4.4
- **Add conditional rendering**:

```typescript
import { PrototypeBadge } from '@/components/shared/PrototypeBadge';

// In render, next to integration name:
{integration.isPrototype && <PrototypeBadge />}
```

#### 0.4.6: Disable Prototype Service Buttons

- **File**: Integration settings component
- **Duration**: 5 min
- **Dependencies**: 0.4.5
- **Add disabled state to buttons**:

```typescript
<Button
    disabled={integration.isPrototype && !integration.isConnected()}
    className={integration.isPrototype ? 'opacity-50' : ''}
>
    Connect
</Button>
```

---

# PHASE 1: Critical Bug Fixes (BLOCKING)

**Duration**: 8 hours | **Priority**: CRITICAL | **Blocks**: Phase 2-6 | **Micro-Tasks**: 18

---

## Task 1.1: Fix VideoStudio State Management Bug

**File**: `src/components/video-studio/VideoModelSelector.tsx`
**Issue**: Line 26 uses `useState()` instead of Zustand store

### Micro-Tasks (7 tasks, ~45 min sequential)

#### 1.1.1: Add selectedModelId to VideoState Interface

- **File**: `src/lib/types/video-studio.ts`
- **Lines**: 17-31 (VideoState interface)
- **Duration**: 6 min
- **Dependencies**: None
- **Add before closing brace**:

```typescript
selectedModelId: string; // Model ID from AVAILABLE_VIDEO_MODELS
```

#### 1.1.2: Add setSelectedModel to VideoStudioStore Interface

- **File**: `src/lib/store/video-studio-store.ts`
- **Lines**: 75-88 (interface)
- **Duration**: 5 min
- **Dependencies**: 1.1.1
- **Add**:

```typescript
    setSelectedModel: (modelId: string) => void;
```

#### 1.1.3: Add selectedModelId to Initial State

- **File**: `src/lib/store/video-studio-store.ts`
- **Lines**: 90-110 (initial state)
- **Duration**: 5 min
- **Dependencies**: 1.1.1
- **Add**:

```typescript
            selectedModelId: 'runway-gen3-alpha',
```

#### 1.1.4: Implement setSelectedModel Action

- **File**: `src/lib/store/video-studio-store.ts`
- **Lines**: After line 141 (after setAdvanced)
- **Duration**: 6 min
- **Dependencies**: 1.1.2
- **Add**:

```typescript
            setSelectedModel: (modelId) => set({ selectedModelId: modelId }),
```

#### 1.1.5: Refactor VideoModelSelector Imports

- **File**: `src/components/video-studio/VideoModelSelector.tsx`
- **Lines**: 1-12 (imports)
- **Duration**: 5 min
- **Dependencies**: 1.1.4
- **Remove**: `import { useState } from 'react';`
- **Keep store import**

#### 1.1.6: Replace useState with Store Hook

- **File**: `src/components/video-studio/VideoModelSelector.tsx`
- **Lines**: 26 (the useState line)
- **Duration**: 8 min
- **Dependencies**: 1.1.5
- **Replace**:

```typescript
const [selectedId, setSelectedId] = useState(AVAILABLE_VIDEO_MODELS[0].id);
```

- **With**:

```typescript
const selectedModelId = useVideoStudioStore((state) => state.selectedModelId);
const setSelectedModel = useVideoStudioStore((state) => state.setSelectedModel);
```

- **Also update**:

```typescript
const activeModel =
  AVAILABLE_VIDEO_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_VIDEO_MODELS[0];
```

#### 1.1.7: Update onClick Handler

- **File**: `src/components/video-studio/VideoModelSelector.tsx`
- **Lines**: 48-52 (DropdownMenuItem onClick)
- **Duration**: 5 min
- **Dependencies**: 1.1.6
- **Replace**: `setSelectedId(model.id)` → `setSelectedModel(model.id)`

---

## Task 1.3: Fix Chat API Model Routing

**File**: `src/app/api/chat/route.ts`
**Issue**: Line 10 hardcodes `gpt-4-turbo`, ignores user selection

### Micro-Tasks (6 tasks, ~35 min sequential)

#### 1.3.1: Update Request Body Parsing

- **File**: `src/app/api/chat/route.ts`
- **Lines**: 6-8
- **Duration**: 6 min
- **Dependencies**: None
- **Replace**:

```typescript
const { messages } = await req.json();
```

- **With**:

```typescript
const { messages, modelId = 'gpt-4.5-turbo', providerId = 'openai' } = await req.json();
```

#### 1.3.2: Import createUniversalModel

- **File**: `src/app/api/chat/route.ts`
- **Lines**: 1-3 (imports)
- **Duration**: 4 min
- **Dependencies**: None
- **Add**:

```typescript
import { createUniversalModel } from '@/lib/models/universal-model-factory';
```

#### 1.3.3: Import SUPPORTED_MODELS

- **File**: `src/app/api/chat/route.ts`
- **Lines**: 1-4 (imports)
- **Duration**: 4 min
- **Dependencies**: 0.1.3
- **Add**:

```typescript
import { SUPPORTED_MODELS } from '@/lib/models/supported-models';
```

#### 1.3.4: Add Model Validation

- **File**: `src/app/api/chat/route.ts`
- **Lines**: After request parsing, before streamText
- **Duration**: 8 min
- **Dependencies**: 1.3.1, 1.3.3
- **Add**:

```typescript
// Validate model exists
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
```

#### 1.3.5: Replace Hardcoded Model

- **File**: `src/app/api/chat/route.ts`
- **Lines**: 9-12 (streamText call)
- **Duration**: 6 min
- **Dependencies**: 1.3.2, 1.3.4
- **Replace**:

```typescript
model: openai('gpt-4-turbo'),
```

- **With**:

```typescript
model: createUniversalModel(providerId, modelId),
```

#### 1.3.6: Remove Unused openai Import (if applicable)

- **File**: `src/app/api/chat/route.ts`
- **Lines**: 1 (imports)
- **Duration**: 3 min
- **Dependencies**: 1.3.5
- **Remove if no longer used**:

```typescript
import { openai } from '@ai-sdk/openai';
```

---

## Task 1.4: Update Chat Components to Pass Selected Model

**Files**: `src/components/chat/ChatOrchestrator.tsx`, NEW `src/lib/hooks/useChatWithModel.ts`

### Micro-Tasks (5 tasks, ~40 min sequential)

#### 1.4.1: Create useChatWithModel Hook

- **File**: NEW `src/lib/hooks/useChatWithModel.ts`
- **Duration**: 10 min
- **Dependencies**: 0.1.9
- **Code**:

```typescript
'use client';

import { useChat as aiUseChat, UseChatOptions } from 'ai/react';
import { SUPPORTED_MODELS } from '@/lib/models/supported-models';

interface UseChatWithModelOptions extends UseChatOptions {
  modelId?: string;
  providerId?: string;
}

export function useChatWithModel(options: UseChatWithModelOptions = {}) {
  const { modelId = 'gpt-4.5-turbo', providerId = 'openai', body, ...aiOptions } = options;

  // Validate the model exists
  const modelConfig = SUPPORTED_MODELS.find(
    (m) => m.modelId === modelId && m.providerId === providerId,
  );

  if (!modelConfig) {
    console.warn(`Model not found: ${providerId}/${modelId}. Using default.`);
  }

  return aiUseChat({
    ...aiOptions,
    api: '/api/chat',
    body: {
      ...body,
      modelId,
      providerId,
    },
  });
}
```

#### 1.4.2: Import useChatWithModel in ChatOrchestrator

- **File**: `src/components/chat/ChatOrchestrator.tsx`
- **Lines**: Top imports
- **Duration**: 4 min
- **Dependencies**: 1.4.1
- **Add**:

```typescript
import { useChatWithModel } from '@/lib/hooks/useChatWithModel';
```

#### 1.4.3: Get Model from Active Thread

- **File**: `src/components/chat/ChatOrchestrator.tsx`
- **Lines**: After activeThread definition (~line 36)
- **Duration**: 6 min
- **Dependencies**: 0.2.2
- **Add**:

```typescript
// Get model selection from thread (with defaults)
const threadModelId = activeThread?.modelId || 'gpt-4.5-turbo';
const threadProviderId = 'openai'; // TODO: Add providerId to ChatThread
```

#### 1.4.4: Replace useChat with useChatWithModel

- **File**: `src/components/chat/ChatOrchestrator.tsx`
- **Lines**: useChat hook call (~line 55-65)
- **Duration**: 10 min
- **Dependencies**: 1.4.2, 1.4.3
- **Replace useChat with**:

```typescript
const { messages, append, setMessages, status } = useChatWithModel({
  id: activeThreadId || 'new-session',
  modelId: threadModelId,
  providerId: threadProviderId,
  onFinish: (message: any) => {
    addMessage({
      role: 'assistant',
      content: getMsgContent(message),
      parentId: currentLeafId,
    });
  },
});
```

#### 1.4.5: Add Model Indicator to UI

- **File**: `src/components/chat/ChatOrchestrator.tsx`
- **Lines**: Near view toggle section (~line 209)
- **Duration**: 8 min
- **Dependencies**: 1.4.4
- **Add model display**:

```typescript
<div className="text-xs text-muted-foreground px-2">
    Model: <span className="font-semibold text-foreground">{threadModelId}</span>
</div>
```

---

# PARALLELIZATION WAVES

## Wave 1: Type Definitions (Parallel Safe)

**Duration**: ~10 min | **Tasks**: 0.1.1, 0.1.2, 0.2.1, 1.1.1
**Notes**: Independent interface/import additions

## Wave 2: Interface Extensions (Depends on Wave 1)

**Duration**: ~10 min | **Tasks**: 0.1.3, 0.2.2, 0.2.4, 0.3.1, 0.3.2, 1.1.2

## Wave 3: Implementation (Depends on Wave 2)

**Duration**: ~15 min | **Tasks**: 0.1.4-0.1.8, 0.2.3, 0.2.5, 0.3.3-0.3.5, 0.4.1, 1.1.3, 1.1.4

## Wave 4: Integration (Depends on Wave 3)

**Duration**: ~15 min | **Tasks**: 0.1.9, 0.2.6, 0.3.6-0.3.7, 0.4.2-0.4.6, 1.1.5-1.1.7, 1.3.1-1.3.6

## Wave 5: Component Updates (Depends on Wave 4)

**Duration**: ~10 min | **Tasks**: 1.4.1-1.4.5

---

# Phase 2-6: High-Level Task Breakdown

## Phase 2: Model Provider Expansion

**Duration**: 18 hours | **Priority**: HIGH | **Parallelizable**: Yes

### Task 2.1: Complete Image Generation Model List

**File**: `src/lib/store/image-studio-store.ts`

| Model ID           | Display Name        | Provider     |
| ------------------ | ------------------- | ------------ |
| `stability-sdxl`   | Stability AI SDXL   | Stability AI |
| `leonardo-phoenix` | Leonardo.ai Phoenix | Leonardo.ai  |
| `replicate-flux`   | Replicate FLUX      | Replicate    |
| `ideogram-v2`      | Ideogram v2         | Ideogram     |
| `recraft-v3`       | Recraft V3          | Recraft      |
| `playground-v2.5`  | Playground AI v2.5  | Playground   |

### Task 2.2: Complete Video Generation Model List

**File**: `src/lib/store/video-studio-store.ts`

| Model ID          | Display Name    | Provider     |
| ----------------- | --------------- | ------------ |
| `pika-v1.5`       | Pika Labs 1.5   | Pika         |
| `stability-video` | Stability Video | Stability AI |
| `genmo-mochi`     | Genmo Mochi     | Genmo        |
| `pixverse-v2`     | PixVerse V2     | PixVerse     |
| `haiper-1.5`      | Haiper 1.5      | Haiper       |

### Task 2.3: Complete Audio/TTS Model List

**File**: `src/lib/store/audio-studio-store.ts`

| Model ID        | Display Name   | Provider    |
| --------------- | -------------- | ----------- |
| `playht-2.0`    | PlayHT 2.0     | PlayHT      |
| `resemble-v3`   | Resemble.ai V3 | Resemble AI |
| `murf-studio`   | Murf Studio    | Murf AI     |
| `wellsaid-labs` | WellSaid Labs  | WellSaid    |
| `speechify-api` | Speechify API  | Speechify   |

### Task 2.4: Create Unified Provider Configuration System

**New Files**: `src/lib/providers/types.ts`, `src/lib/providers/registry.ts`

- Unified ProviderConfig interface
- Central provider registry singleton
- API key validation utility

### Task 2.5: Add Provider API Key Management UI

**File**: `src/components/settings/ModelManager.tsx`

- API key input fields per provider
- Connection test buttons
- Visual status indicators

---

## Phase 3: Real API Implementation

**Duration**: 28 hours | **Priority**: HIGH | **Parallelizable**: Yes

### Task 3.1: Implement Real Image Generation API

**New File**: `src/app/api/generate/image/route.ts`

- Adapters: OpenAI DALL-E 3, Stability AI, Replicate, FAL.ai
- SSE progress streaming
- Rate limiting per provider

### Task 3.2: Implement Real Video Generation API

**New File**: `src/app/api/generate/video/route.ts`

- Adapters: Runway Gen-3, Luma Dream Machine, Replicate
- Async job handling (videos take minutes)
- Webhook callbacks for completion

### Task 3.3: Implement Real Audio/TTS Generation API

**New File**: `src/app/api/generate/audio/route.ts`

- Adapters: ElevenLabs, OpenAI TTS, PlayHT, Coqui XTTS
- Streaming audio support
- Voice cloning upload endpoint

---

## Phase 4: Data Persistence Layer

**Duration**: 24 hours | **Priority**: HIGH | **Parallelizable**: Partially

### Task 4.1: Add Database Layer (Supabase)

**New Files**: `src/lib/db/client.ts`, `src/lib/db/schema.sql`

Schema tables:

- `users` (id, email, created_at, settings_json)
- `conversations` (id, user_id, title, created_at)
- `messages` (id, conversation_id, role, content, model_id)
- `generations` (id, user_id, type, prompt, model_id, result_url)
- `api_usage` (id, user_id, provider, tokens_in, tokens_out, cost_cents)

### Task 4.2: Complete NextAuth User Authentication

**Files**: `src/app/api/auth/[...nextauth]/route.ts`, `src/lib/auth/`

- Supabase adapter for NextAuth
- Protected API routes middleware
- OAuth refresh token handling

### Task 4.3: Add Conversation History Sync

- Save conversations to Supabase on message send
- Realtime sync using Supabase subscriptions
- Offline support with localStorage fallback

### Task 4.4: Migrate Zustand Stores to Hybrid Persistence

- Hybrid middleware (localStorage + Supabase)
- Sync on login/logout
- Graceful degradation if DB unavailable

---

## Phase 5: Complete Studio Components

**Duration**: 24 hours | **Priority**: MEDIUM | **Parallelizable**: Yes

### Task 5.1: Complete Icon Studio StyleDNABuilder

**File**: `src/components/icon-studio/StyleDNABuilder.tsx`

### Task 5.2: Complete Icon Studio ConceptInput

**File**: `src/components/icon-studio/ConceptInput.tsx`

### Task 5.3: Complete DAW Composer Mode

**Files**: `src/components/audio-studio/daw/*.tsx`

### Task 5.4: Complete Image Canvas Rendering

**File**: `src/components/image-studio/UnifiedCanvas.tsx`

---

## Phase 6: Essential Missing Features

**Duration**: 54 hours | **Priority**: MEDIUM | **Parallelizable**: Highly

### Task 6.1: Add Chat Attachment/File Upload Support

### Task 6.2: Add Chat Code Syntax Highlighting

### Task 6.3: Add Conversation Search Functionality

### Task 6.4: Add Prompt Library/Favorites System

### Task 6.5: Add Workbench Filtering & Sorting Controls

### Task 6.6: Add Generation Cost Estimator/Calculator

### Task 6.7: Add API Usage Analytics Dashboard

### Task 6.8: Add Storage Provider Integration UI

### Task 6.9: Add Mobile Responsive Layout

---

## Dependency Graph

```
Phase 0: [0.1] [0.2] [0.3] [0.4]     (Critical Gaps - Parallel)
              ↓
Phase 1: [1.1] [1.3] → [1.4]         (Bug Fixes)
              ↓
Phase 2: [2.1] [2.2] [2.3] → [2.4] → [2.5]  (Model Registries)
              ↓
Phase 3: [3.1] [3.2] [3.3]           (API Implementation - Parallel)
              ↓
Phase 4: [4.1] → [4.2] → [4.3] [4.4] (Database - Critical Path)
              ↓
Phase 5: [5.1] [5.2] [5.3] [5.4]     (Studio Components - Parallel)
              ↓
Phase 6: [6.1-6.9]                    (Features - Highly Parallel)
```

---

## Agent Assignment Matrix

| Agent                 | Tasks                                                     | Hours |
| --------------------- | --------------------------------------------------------- | ----- |
| **typescript-dev**    | 0.1, 0.2, 1.1, 1.4, 2.1-2.4, 4.2, 4.4, 6.1, 6.3, 6.4, 6.6 | 52h   |
| **api-engineer**      | 0.3, 1.3, 3.1, 3.2, 3.3                                   | 31h   |
| **db-engineer**       | 4.1, 4.3, 6.7                                             | 22h   |
| **frontend-dev**      | 0.4, 2.5, 5.1-5.4, 6.2, 6.5, 6.8, 6.9                     | 51h   |
| **security-reviewer** | 4.2 (assist)                                              | 2h    |
| **test-engineer**     | All phases validation                                     | 16h   |

---

## Risk Mitigation

| Risk                 | Mitigation                          | Fallback                   |
| -------------------- | ----------------------------------- | -------------------------- |
| Provider API Changes | Abstract adapters, version pin SDKs | Graceful degradation       |
| OAuth Token Expiry   | Refresh token rotation              | Re-auth prompt             |
| Cost Overruns        | Budget alerts, rate limiting        | Free tier fallbacks        |
| Supabase Downtime    | Local-first with sync               | Full localStorage fallback |

---

## Success Criteria

- [ ] All 29 improvements implemented and tested
- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] All critical bugs fixed (Phase 0-1)
- [ ] Model lists complete with provider attribution
- [ ] At least one real API working per modality (image, video, audio)
- [ ] Database persistence functional
- [ ] Mobile responsive on iOS Safari + Android Chrome
